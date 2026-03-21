"""
Scoped analysis service — generates AI sub-reports for specific page types.

Filters audit data to a scope (e.g., product pages only), runs a subset
of AI context analyses, and generates scoped executive summary + quick wins.
"""

import asyncio
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Audit, ScopedReport, BusinessContext
from app.services import ai_analysis
from app.services.global_context import build_global_snapshot, format_global_snapshot_for_prompt
from app.services.ai_client import call_claude

logger = logging.getLogger(__name__)

# Cost per scoped report in credits
SCOPED_REPORT_CREDIT_COST = 3


def filter_crawl_data(crawl_data: Dict[str, Any], scope_filter: Dict[str, Any]) -> Dict[str, Any]:
    """
    Filter crawl data to only include pages matching the scope.
    Returns a modified copy of crawl_data with filtered all_pages.
    """
    all_pages = crawl_data.get("all_pages", [])
    classifications = crawl_data.get("page_classifications", {})

    page_type = scope_filter.get("page_type")
    urls = scope_filter.get("urls")

    if page_type:
        filtered = [p for p in all_pages if classifications.get(p.get("url", "")) == page_type]
    elif urls:
        url_set = set(urls)
        filtered = [p for p in all_pages if p.get("url", "") in url_set]
    else:
        filtered = all_pages

    # Build scoped crawl data
    scoped = {**crawl_data}
    scoped["all_pages"] = filtered
    scoped["pages_crawled"] = len(filtered)

    # Recompute basic stats for scoped data
    broken = sum(1 for p in filtered if (p.get("status_code") or 0) >= 400)
    noindex = sum(1 for p in filtered if "noindex" in (p.get("meta_robots") or "").lower())
    missing_canonical = sum(1 for p in filtered if not p.get("canonical") and p.get("status_code") == 200)
    missing_title = sum(1 for p in filtered if not p.get("title"))
    missing_meta = sum(1 for p in filtered if not p.get("meta_description"))
    missing_h1 = sum(1 for p in filtered if not p.get("h1"))

    scoped["technical_seo"] = {
        **(crawl_data.get("technical_seo") or {}),
        "broken_links": broken,
        "noindex_pages": noindex,
        "missing_canonical": missing_canonical,
    }
    scoped["_scope_stats"] = {
        "total_pages": len(filtered),
        "broken_links": broken,
        "noindex_pages": noindex,
        "missing_canonical": missing_canonical,
        "missing_title": missing_title,
        "missing_meta": missing_meta,
        "missing_h1": missing_h1,
    }

    return scoped


async def generate_scoped_executive_summary(
    scope_label: str,
    scope_stats: Dict[str, Any],
    ai_contexts: Dict[str, Any],
    global_snapshot_str: str,
) -> Dict[str, Any]:
    """Generate a scoped executive summary for the sub-report."""
    findings_summary = []
    for area, ctx in ai_contexts.items():
        if isinstance(ctx, dict):
            for f in (ctx.get("key_findings") or [])[:2]:
                findings_summary.append(f"[{area}] {f}")

    system_prompt = f"""Jestes ekspertem SEO. Przygotuj krotkie podsumowanie analizy
skupionej na stronach typu: {scope_label}.

Odpowiedz w JSON:
{{
    "summary": "2-3 zdania podsumowania",
    "strengths": ["...", "..."],
    "critical_issues": ["...", "..."],
    "top_recommendations": ["...", "...", "..."]
}}"""

    user_prompt = f"""Statystyki scope ({scope_label}):
{scope_stats}

Kluczowe ustalenia z analiz:
{chr(10).join(findings_summary[:15])}

{global_snapshot_str}

Wygeneruj podsumowanie. Odpowiedz TYLKO JSON."""

    try:
        import json
        response = await call_claude(user_prompt, system_prompt=system_prompt, max_tokens=1024)
        text = response.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
            if text.endswith("```"):
                text = text[:-3]
        return json.loads(text.strip())
    except Exception as e:
        logger.warning("Scoped executive summary failed: %s", e)
        return {"summary": f"Analiza {scope_label} — brak podsumowania (blad AI)", "strengths": [], "critical_issues": [], "top_recommendations": []}


async def run_scoped_analysis(
    db: AsyncSession,
    scoped_report: ScopedReport,
) -> None:
    """
    Run AI analyses on scoped (filtered) audit data.
    Updates ScopedReport.results and status in place.
    """
    try:
        scoped_report.status = "processing"
        await db.commit()

        # Load audit
        result = await db.execute(select(Audit).where(Audit.id == scoped_report.audit_id))
        audit = result.scalar_one_or_none()
        if not audit or not audit.results:
            scoped_report.status = "failed"
            scoped_report.error_message = "Audit not found or has no results"
            await db.commit()
            return

        # Load business context
        bc_dict = None
        if audit.business_context_id:
            bc_result = await db.execute(select(BusinessContext).where(BusinessContext.id == audit.business_context_id))
            bc = bc_result.scalar_one_or_none()
            if bc:
                bc_dict = {
                    "business_type": bc.business_type,
                    "industry": bc.industry,
                    "business_goals": bc.business_goals,
                    "priorities": bc.priorities,
                    "team_capabilities": bc.team_capabilities,
                }

        # Filter data
        crawl_data = audit.results.get("crawl", {})
        lighthouse_data = audit.results.get("lighthouse", {})
        senuto_data = audit.results.get("senuto", {})

        scoped_crawl = filter_crawl_data(crawl_data, scoped_report.scope_filter)
        scope_stats = scoped_crawl.get("_scope_stats", {})

        if scope_stats.get("total_pages", 0) == 0:
            scoped_report.status = "failed"
            scoped_report.error_message = f"Brak stron w scope '{scoped_report.scope_label}'"
            await db.commit()
            return

        # Build global snapshot with scope context
        global_snapshot = build_global_snapshot(
            crawl=scoped_crawl,
            lighthouse=lighthouse_data,
            senuto=senuto_data,
            extra={
                "phase": "scoped_analysis",
                "scope_type": scoped_report.scope_type,
                "scope_label": scoped_report.scope_label,
                "scoped_pages_count": scope_stats.get("total_pages", 0),
            },
            business_context=bc_dict,
        )

        snapshot_str = format_global_snapshot_for_prompt(global_snapshot)

        # Add scope instruction to snapshot
        scope_instruction = (
            f"\nSCOPE: Ta analiza dotyczy WYLACZNIE stron typu '{scoped_report.scope_label}' "
            f"({scope_stats.get('total_pages', 0)} stron). "
            f"Skupiaj sie na problemach specyficznych dla tego typu stron. "
            f"NIE powtarzaj wnioskow z pelnego raportu — szukaj nowych insightow.\n"
        )

        # Run subset of AI analyses in parallel
        # We run 5 key analyses for scoped reports (not all 13)
        ai_contexts = {}

        tasks = {
            "seo": ai_analysis.analyze_seo_context(
                scoped_crawl, lighthouse_data, senuto_data,
                global_snapshot={**global_snapshot},
            ),
            "content_quality": ai_analysis.analyze_content_quality_context(
                audit.results.get("content_quality_index"),
                scoped_crawl,
                global_snapshot={**global_snapshot},
            ),
            "links": ai_analysis.analyze_links_context(
                scoped_crawl,
                global_snapshot={**global_snapshot},
            ),
            "images": ai_analysis.analyze_images_context(
                scoped_crawl,
                global_snapshot={**global_snapshot},
            ),
            "architecture": ai_analysis.analyze_architecture_context(
                scoped_crawl,
                global_snapshot={**global_snapshot},
            ),
        }

        results_list = await asyncio.gather(
            *tasks.values(),
            return_exceptions=True,
        )

        for key, res in zip(tasks.keys(), results_list):
            if isinstance(res, Exception):
                logger.warning("Scoped analysis %s failed: %s", key, res)
                ai_contexts[key] = {"error": str(res)}
            else:
                ai_contexts[key] = res or {}

        # Generate scoped executive summary
        executive_summary = await generate_scoped_executive_summary(
            scoped_report.scope_label,
            scope_stats,
            ai_contexts,
            snapshot_str + scope_instruction,
        )

        # Aggregate quick wins from all scoped contexts
        quick_wins = []
        for ctx in ai_contexts.values():
            if isinstance(ctx, dict):
                quick_wins.extend(ctx.get("quick_wins", []))
        # Deduplicate by title
        seen_titles = set()
        unique_qw = []
        for qw in quick_wins:
            title = qw.get("title", "") if isinstance(qw, dict) else str(qw)
            if title not in seen_titles:
                seen_titles.add(title)
                unique_qw.append(qw)

        # Save results
        scoped_report.results = {
            "ai_contexts": ai_contexts,
            "executive_summary": executive_summary,
            "quick_wins": unique_qw[:20],
            "scope_stats": scope_stats,
        }
        scoped_report.status = "completed"
        scoped_report.completed_at = datetime.utcnow()
        await db.commit()

        logger.info(
            "Scoped report %s completed: %s, %d contexts, %d quick wins",
            scoped_report.id, scoped_report.scope_label,
            len(ai_contexts), len(unique_qw),
        )

    except Exception as e:
        logger.error("Scoped analysis failed for %s: %s", scoped_report.id, e, exc_info=True)
        scoped_report.status = "failed"
        scoped_report.error_message = str(e)[:500]
        await db.commit()
