"""
Main PDF report generator for SiteSpector.
Orchestrates section data extraction, chart generation, Jinja2 rendering, and WeasyPrint conversion.
"""

import logging
import re
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from jinja2 import Environment, FileSystemLoader, select_autoescape
from weasyprint import HTML, CSS

from app.config import settings
from .config import get_report_config, ReportTypeConfig
from .styles import get_pdf_css
from .utils import build_skipped_sections_notes, safe_get, truncate

# Section extractors
from .sections import (
    executive_summary,
    technical_overview,
    on_page_seo,
    heading_analysis,
    url_structure,
    redirect_analysis,
    structured_data,
    robots_sitemap,
    internal_links,
    performance,
    lighthouse_detail,
    accessibility,
    visibility_overview,
    keywords,
    position_changes,
    organic_competitors,
    backlinks,
    ai_overviews,
    cannibalization,
    anchor_text,
    content,
    ux_mobile,
    security,
    tech_stack,
    ai_insights,
    cross_tool,
    quick_wins,
    roadmap,
    execution_plan,
    benchmark,
    appendix_pages,
    appendix_images,
    appendix_keywords,
    appendix_backlinks,
)

# Chart generators
from .charts import (
    scores_overview_chart,
    cwv_comparison_chart,
    http_status_pie,
    keyword_distribution_chart,
    competitor_comparison_chart,
    intent_distribution_chart,
    line_chart,
    impact_effort_matrix,
    roadmap_timeline_chart,
    execution_plan_priority_chart,
)

logger = logging.getLogger(__name__)

# Jinja2 environment
_TEMPLATE_DIR = Path(__file__).parent.parent.parent.parent / "templates" / "pdf"
_jinja_env = Environment(
    loader=FileSystemLoader(str(_TEMPLATE_DIR)),
    autoescape=select_autoescape(["html"]),
    trim_blocks=True,
    lstrip_blocks=True,
)
_jinja_env.filters["truncate"] = truncate


# ============================================================
# TOC structure
# ============================================================

TOC_PARTS = [
    {
        "label": "CZĘŚĆ I — PODSUMOWANIE",
        "sections": ["executive_summary"],
    },
    {
        "label": "CZĘŚĆ II — SEO TECHNICZNE",
        "sections": [
            "technical_overview", "on_page_seo", "heading_analysis",
            "url_structure", "redirect_analysis", "structured_data",
            "robots_sitemap", "internal_links",
        ],
    },
    {
        "label": "CZĘŚĆ III — WYDAJNOŚĆ",
        "sections": ["performance", "lighthouse_detail", "accessibility"],
    },
    {
        "label": "CZĘŚĆ IV — WIDOCZNOŚĆ ORGANICZNA",
        "sections": [
            "visibility_overview", "keywords", "position_changes",
            "organic_competitors", "backlinks", "ai_overviews",
            "cannibalization", "anchor_text",
        ],
    },
    {
        "label": "CZĘŚĆ V — TREŚĆ & UX",
        "sections": ["content", "ux_mobile", "security", "tech_stack"],
    },
    {
        "label": "CZĘŚĆ VI — STRATEGIA AI",
        "sections": ["ai_insights", "cross_tool", "quick_wins", "roadmap_full", "execution_plan", "benchmark"],
    },
    {
        "label": "CZĘŚĆ VII — ZAŁĄCZNIKI",
        "sections": ["appendix_pages", "appendix_images", "appendix_keywords", "appendix_backlinks"],
    },
]

SECTION_LABELS = {
    "executive_summary": "Executive Summary",
    "technical_overview": "Przegląd Techniczny",
    "on_page_seo": "On-Page SEO",
    "heading_analysis": "Analiza Hierarchii Nagłówków (H1-H2)",
    "url_structure": "Analiza Struktury URL",
    "redirect_analysis": "Analiza Przekierowań",
    "structured_data": "Dane Strukturalne (Schema.org)",
    "robots_sitemap": "Robots.txt, Sitemap i Konfiguracja Domeny",
    "internal_links": "Linkowanie Wewnętrzne",
    "performance": "Wydajność & Core Web Vitals",
    "lighthouse_detail": "Lighthouse — Szczegółowe Audyty",
    "accessibility": "Dostępność (Accessibility)",
    "visibility_overview": "Widoczność — Przegląd",
    "keywords": "Słowa Kluczowe — Pozycje",
    "position_changes": "Zmiany Pozycji",
    "organic_competitors": "Konkurencja Organiczna",
    "backlinks": "Profil Linków Przychodzących",
    "ai_overviews": "AI Overviews (Google AIO)",
    "cannibalization": "Kanibalizacja Słów Kluczowych",
    "anchor_text": "Dystrybucja Anchor Text",
    "content": "Analiza Treści",
    "ux_mobile": "UX & Mobile",
    "security": "Bezpieczeństwo",
    "tech_stack": "Stack Technologiczny",
    "ai_insights": "AI Insights per Obszar",
    "cross_tool": "Analiza Cross-Tool",
    "quick_wins": "Quick Wins",
    "roadmap_full": "Roadmap Strategiczny",
    "roadmap_immediate": "Roadmap — Akcje Natychmiastowe",
    "execution_plan": "Plan Wykonania",
    "benchmark": "Benchmark Branżowy",
    "appendix_pages": "Załącznik A — Lista Stron",
    "appendix_images": "Załącznik B — Lista Obrazów",
    "appendix_keywords": "Załącznik C — Słowa Kluczowe",
    "appendix_backlinks": "Załącznik D — Backlinks",
}


def _build_toc(cfg: ReportTypeConfig, skipped: List[Dict]) -> List[Dict]:
    """Build TOC structure for template."""
    toc_parts = []
    sec_num = 1
    skipped_ids = {s["section_id"] for s in skipped}

    for part in TOC_PARTS:
        items = []
        for sid in part["sections"]:
            # Map roadmap aliases
            effective_sid = "roadmap_full" if sid == "roadmap_full" else sid
            cfg_sid = "roadmap_full" if sid == "roadmap_full" else sid
            if sid in ("roadmap_immediate",):
                cfg_sid = "roadmap_immediate"

            if not cfg.is_enabled(cfg_sid) and not cfg.is_enabled(sid):
                continue
            if sid in skipped_ids:
                continue

            items.append({
                "num": sec_num,
                "sid": sid,
                "title": SECTION_LABELS.get(sid, sid),
            })
            sec_num += 1

        if items:
            toc_parts.append({"label": part["label"], "entries": items})

    return toc_parts


def _render_section(template_name: str, ctx: Dict) -> str:
    """Render a section template to HTML string."""
    try:
        tmpl = _jinja_env.get_template(f"sections/{template_name}.html")
        return tmpl.render(**ctx)
    except Exception as e:
        logger.warning(f"Failed to render section '{template_name}': {e}")
        return f'<div class="section"><p class="text-muted text-small">Sekcja niedostępna: {template_name}</p></div>'


def _safe_chart(fn, *args, **kwargs) -> str:
    """Generate chart, return empty string on failure."""
    try:
        result = fn(*args, **kwargs)
        return result or ""
    except Exception as e:
        logger.warning(f"Chart generation failed ({fn.__name__}): {e}")
        return ""


async def generate_pdf(
    audit_id: str,
    audit_data: Dict[str, Any],
    tasks_list: Optional[List[Dict]] = None,
    report_type: str = "standard",
) -> str:
    """
    Generate PDF report for a completed audit.

    Args:
        audit_id: Audit UUID string
        audit_data: Full audit dict from DB (with .results JSONB)
        tasks_list: List of audit_tasks dicts (from audit_tasks table)
        report_type: 'executive' | 'standard' | 'full'

    Returns:
        Path to generated PDF file

    Raises:
        ValueError: If audit has no results
        Exception: On generation failure
    """
    logger.info(f"Generating PDF for audit {audit_id} (type: {report_type})")

    results = audit_data.get("results")
    if not results:
        raise ValueError(f"Cannot generate PDF — audit {audit_id} has no results")

    cfg = get_report_config(report_type)
    tasks_list = tasks_list or []
    generated_date = datetime.utcnow().strftime("%d.%m.%Y %H:%M UTC")
    audit_url = audit_data.get("url") or ""
    audit_url_short = _shorten_url(audit_url)
    project_name = audit_data.get("project_name") or ""

    # ---- Pre-check data availability ----
    senuto = results.get("senuto") or {}
    has_senuto = bool(senuto and senuto.get("visibility"))
    has_aio = bool(has_senuto and senuto.get("visibility", {}).get("ai_overviews", {}).get("keywords"))

    skipped_sections = build_skipped_sections_notes(cfg, results)
    skipped_ids = {s["section_id"] for s in skipped_sections}

    # ---- Build section number map ----
    sec_counter = [1]

    def next_sec():
        n = sec_counter[0]
        sec_counter[0] += 1
        return n

    # ---- Generate all section HTML blocks ----
    sections_html: List[str] = []

    # Cover
    cover_tmpl = _jinja_env.get_template("sections/cover.html")
    sections_html.append(cover_tmpl.render(
        audit_url=audit_url,
        audit_project_name=project_name,
        generated_date=generated_date,
        report_type_label=cfg.label_pl,
    ))

    # TOC
    toc_parts = _build_toc(cfg, skipped_sections)
    toc_sec_count = sum(len(p["entries"]) for p in toc_parts)
    toc_tmpl = _jinja_env.get_template("sections/toc.html")
    sections_html.append(toc_tmpl.render(
        toc_parts=toc_parts,
        skipped_sections=skipped_sections,
        total_sections=toc_sec_count,
        report_type_label=cfg.label_pl,
        estimated_pages=cfg.estimated_pages,
    ))

    # ---- EXECUTIVE SUMMARY ----
    if cfg.is_enabled("executive_summary"):
        exec_data = executive_summary.extract(audit_data)
        chart_scores = _safe_chart(
            scores_overview_chart,
            exec_data["exec"]["overall_score"] or 0,
            exec_data["exec"]["seo_score"] or 0,
            exec_data["exec"]["performance_score"] or 0,
            exec_data["exec"]["content_score"] or 0,
        )
        sections_html.append(_render_section("executive_summary", {
            **exec_data,
            "sec_num": next_sec(),
            "chart_scores": chart_scores,
        }))

    # ---- TECHNICAL OVERVIEW ----
    if cfg.is_enabled("technical_overview"):
        tech_data = technical_overview.extract(audit_data)
        crawl = results.get("crawl") or {}
        chart_http = _safe_chart(http_status_pie, crawl.get("pages_by_status") or {})
        sections_html.append(_render_section("technical_overview", {
            **tech_data,
            "sec_num": next_sec(),
            "chart_http_status": chart_http,
        }))

    # ---- ON-PAGE SEO ----
    if cfg.is_enabled("on_page_seo"):
        max_rows = cfg.get_max_rows("on_page_seo", 50)
        extended = cfg.is_extended("on_page_seo")
        onpage_data = on_page_seo.extract(audit_data, max_rows=max_rows, extended=extended)
        sections_html.append(_render_section("on_page_seo", {
            **onpage_data,
            "sec_num": next_sec(),
        }))

    # ---- HEADING ANALYSIS ----
    if cfg.is_enabled("heading_analysis"):
        extended = cfg.is_extended("heading_analysis")
        ha_data = heading_analysis.extract(audit_data, extended=extended)
        sections_html.append(_render_section("heading_analysis", {
            **ha_data,
            "sec_num": next_sec(),
        }))

    # ---- URL STRUCTURE ----
    if cfg.is_enabled("url_structure"):
        us_data = url_structure.extract(audit_data)
        sections_html.append(_render_section("url_structure", {
            **us_data,
            "sec_num": next_sec(),
        }))

    # ---- REDIRECT ANALYSIS ----
    if cfg.is_enabled("redirect_analysis"):
        ra_data = redirect_analysis.extract(audit_data)
        sections_html.append(_render_section("redirect_analysis", {
            **ra_data,
            "sec_num": next_sec(),
        }))

    # ---- STRUCTURED DATA ----
    if cfg.is_enabled("structured_data"):
        sd_data = structured_data.extract(audit_data)
        sections_html.append(_render_section("structured_data", {
            **sd_data,
            "sec_num": next_sec(),
        }))

    # ---- ROBOTS.TXT & SITEMAP ----
    if cfg.is_enabled("robots_sitemap"):
        rs_data = robots_sitemap.extract(audit_data)
        sections_html.append(_render_section("robots_sitemap", {
            **rs_data,
            "sec_num": next_sec(),
        }))

    # ---- INTERNAL LINKS ----
    if cfg.is_enabled("internal_links"):
        max_rows = cfg.get_max_rows("internal_links", 50)
        links_data = internal_links.extract(audit_data, max_rows=max_rows)
        sections_html.append(_render_section("internal_links", {
            **links_data,
            "sec_num": next_sec(),
        }))

    # ---- PERFORMANCE ----
    if cfg.is_enabled("performance"):
        perf_data = performance.extract(audit_data)
        chart_cwv = _safe_chart(
            cwv_comparison_chart,
            perf_data["perf"]["desktop_cwv_dict"],
            perf_data["perf"]["mobile_cwv_dict"],
        )
        sections_html.append(_render_section("performance", {
            **perf_data,
            "sec_num": next_sec(),
            "chart_cwv": chart_cwv,
        }))

    # ---- LIGHTHOUSE DETAIL ----
    if cfg.is_enabled("lighthouse_detail"):
        max_rows = cfg.get_max_rows("lighthouse_detail", 15)
        extended = cfg.is_extended("lighthouse_detail")
        lh_data = lighthouse_detail.extract(audit_data, max_rows=max_rows, extended=extended)
        sections_html.append(_render_section("lighthouse_detail", {
            **lh_data,
            "sec_num": next_sec(),
        }))

    # ---- ACCESSIBILITY ----
    if cfg.is_enabled("accessibility"):
        acc_data = accessibility.extract(audit_data)
        sections_html.append(_render_section("accessibility", {
            **acc_data,
            "sec_num": next_sec(),
        }))

    # ---- SENUTO SECTIONS (conditional) ----
    if has_senuto:
        # Visibility overview
        if cfg.is_enabled("visibility_overview"):
            vis_data = visibility_overview.extract(audit_data)
            senuto_vis = (results.get("senuto") or {}).get("visibility") or {}
            positions_raw = vis_data["vis"]["positions_raw"]

            chart_kw_dist = _safe_chart(
                keyword_distribution_chart,
                vis_data["vis"]["top3_count"],
                vis_data["vis"]["top10_count"],
                vis_data["vis"]["top50_count"],
            )
            # Seasonality
            chart_seasonality = ""
            seasonality = vis_data["vis"].get("seasonality")
            if seasonality and isinstance(seasonality, dict):
                months = list(seasonality.keys())
                vals = list(seasonality.values())
                if months and vals:
                    chart_seasonality = _safe_chart(
                        line_chart,
                        months,
                        [{"label": "Widoczność", "values": [float(v) for v in vals], "color": "#3b82f6"}],
                        title="Sezonowość widoczności",
                        filled=True,
                    )

            sections_html.append(_render_section("visibility_overview", {
                **vis_data,
                "sec_num": next_sec(),
                "chart_keyword_dist": chart_kw_dist,
                "chart_seasonality": chart_seasonality,
            }))

        # Keywords
        if cfg.is_enabled("keywords") and "keywords" not in skipped_ids:
            max_rows = cfg.get_max_rows("keywords", 50)
            kw_data = keywords.extract(audit_data, max_rows=max_rows)
            vis_positions = kw_data["kw"]["positions"]
            chart_intent = _safe_chart(intent_distribution_chart, vis_positions)
            sections_html.append(_render_section("keywords", {
                **kw_data,
                "sec_num": next_sec(),
                "chart_intent": chart_intent,
                "chart_difficulty": "",
            }))

        # Position changes
        if cfg.is_enabled("position_changes") and "position_changes" not in skipped_ids:
            max_rows = cfg.get_max_rows("position_changes", 20)
            ext = cfg.is_extended("position_changes")
            ch_data = position_changes.extract(audit_data, max_rows=max_rows)
            sections_html.append(_render_section("position_changes", {
                **ch_data,
                "sec_num": next_sec(),
            }))

        # Organic competitors
        if cfg.is_enabled("organic_competitors") and "organic_competitors" not in skipped_ids:
            oc_data = organic_competitors.extract(audit_data)
            chart_comp = _safe_chart(
                competitor_comparison_chart,
                oc_data["org_comp"]["competitors"],
                "common_keywords",
                "Wspólne frazy kluczowe z konkurencją",
            )
            sections_html.append(_render_section("organic_competitors", {
                **oc_data,
                "sec_num": next_sec(),
                "chart_competitors": chart_comp,
            }))

        # Backlinks
        if cfg.is_enabled("backlinks") and "backlinks" not in skipped_ids:
            max_rows = cfg.get_max_rows("backlinks", 50)
            bl_data = backlinks.extract(audit_data, max_rows=max_rows)
            sections_html.append(_render_section("backlinks", {
                **bl_data,
                "sec_num": next_sec(),
            }))

        # AI Overviews
        if has_aio and cfg.is_enabled("ai_overviews") and "ai_overviews" not in skipped_ids:
            max_rows = cfg.get_max_rows("ai_overviews", 20)
            aio_data = ai_overviews.extract(audit_data, max_rows=max_rows)
            sections_html.append(_render_section("ai_overviews", {
                **aio_data,
                "sec_num": next_sec(),
            }))

        # Cannibalization
        if cfg.is_enabled("cannibalization"):
            can_data = cannibalization.extract(audit_data)
            sections_html.append(_render_section("cannibalization", {
                **can_data,
                "sec_num": next_sec(),
            }))

        # Anchor Text Distribution
        if cfg.is_enabled("anchor_text"):
            at_data = anchor_text.extract(audit_data)
            sections_html.append(_render_section("anchor_text", {
                **at_data,
                "sec_num": next_sec(),
            }))

    # ---- CONTENT ----
    if cfg.is_enabled("content"):
        ct_data = content.extract(audit_data)
        sections_html.append(_render_section("content", {
            **ct_data,
            "sec_num": next_sec(),
        }))

    # ---- UX MOBILE ----
    if cfg.is_enabled("ux_mobile"):
        ux_data = ux_mobile.extract(audit_data)
        sections_html.append(_render_section("ux_mobile", {
            **ux_data,
            "sec_num": next_sec(),
        }))

    # ---- SECURITY ----
    if cfg.is_enabled("security"):
        sec_data = security.extract(audit_data)
        sections_html.append(_render_section("security", {
            **sec_data,
            "sec_num": next_sec(),
        }))

    # ---- TECH STACK ----
    if cfg.is_enabled("tech_stack"):
        ts_data = tech_stack.extract(audit_data)
        sections_html.append(_render_section("tech_stack", {
            **ts_data,
            "sec_num": next_sec(),
        }))

    # ---- AI INSIGHTS PER AREA ----
    if cfg.is_enabled("ai_insights"):
        extended = cfg.is_extended("ai_insights")
        ai_data = ai_insights.extract(audit_data, extended=extended)
        sections_html.append(_render_section("ai_insights", {
            **ai_data,
            "sec_num": next_sec(),
        }))

    # ---- CROSS-TOOL ----
    if cfg.is_enabled("cross_tool"):
        ct_data = cross_tool.extract(audit_data)
        sections_html.append(_render_section("cross_tool", {
            **ct_data,
            "sec_num": next_sec(),
        }))

    # ---- QUICK WINS ----
    if cfg.is_enabled("quick_wins"):
        max_rows_qw = cfg.get_max_rows("quick_wins", 24)
        qw_data = quick_wins.extract(audit_data, max_rows=max_rows_qw)
        all_qw = qw_data["qw_high"] + qw_data["qw_medium"] + qw_data["qw_low"]
        chart_matrix = _safe_chart(impact_effort_matrix, all_qw)
        sections_html.append(_render_section("quick_wins", {
            **qw_data,
            "sec_num": next_sec(),
            "chart_matrix": chart_matrix,
        }))

    # ---- ROADMAP ----
    immediate_only = cfg.is_enabled("roadmap_immediate") and not cfg.is_enabled("roadmap_full")
    roadmap_section_id = "roadmap_immediate" if immediate_only else "roadmap_full"
    if cfg.is_enabled(roadmap_section_id):
        rm_data = roadmap.extract(audit_data, immediate_only=immediate_only)
        chart_rm = _safe_chart(roadmap_timeline_chart, rm_data["roadmap"])
        sections_html.append(_render_section("roadmap", {
            **rm_data,
            "sec_num": next_sec(),
            "chart_roadmap": chart_rm,
        }))

    # ---- EXECUTION PLAN ----
    if cfg.is_enabled("execution_plan"):
        max_rows_ep = cfg.get_max_rows("execution_plan", 30)
        extended_ep = cfg.is_extended("execution_plan")
        ep_data = execution_plan.extract(
            audit_data,
            tasks=tasks_list,
            max_rows=max_rows_ep,
            extended=extended_ep,
        )
        all_tasks_for_chart = tasks_list[:max_rows_ep] if not extended_ep else tasks_list
        chart_priority = _safe_chart(execution_plan_priority_chart, all_tasks_for_chart)
        sections_html.append(_render_section("execution_plan", {
            **ep_data,
            "sec_num": next_sec(),
            "chart_priority": chart_priority,
        }))

    # ---- BENCHMARK ----
    if cfg.is_enabled("benchmark"):
        bench_data = benchmark.extract(audit_data)
        sections_html.append(_render_section("benchmark", {
            **bench_data,
            "sec_num": next_sec(),
        }))

    # ---- APPENDIX PAGES ----
    if cfg.is_enabled("appendix_pages"):
        max_rows_ap = cfg.get_max_rows("appendix_pages")  # None = all
        ap_data = appendix_pages.extract(audit_data, max_rows=max_rows_ap)
        sections_html.append(_render_section("appendix_pages", {
            **ap_data,
            "sec_num": next_sec(),
        }))

    # ---- APPENDIX IMAGES ----
    if cfg.is_enabled("appendix_images"):
        max_rows_ai = cfg.get_max_rows("appendix_images", 100)
        ai_app_data = appendix_images.extract(audit_data, max_rows=max_rows_ai)
        sections_html.append(_render_section("appendix_images", {
            **ai_app_data,
            "sec_num": next_sec(),
        }))

    # ---- APPENDIX KEYWORDS ----
    if cfg.is_enabled("appendix_keywords") and has_senuto:
        max_rows_ak = cfg.get_max_rows("appendix_keywords", 200)
        ak_data = appendix_keywords.extract(audit_data, max_rows=max_rows_ak)
        sections_html.append(_render_section("appendix_keywords", {
            **ak_data,
            "sec_num": next_sec(),
        }))

    # ---- APPENDIX BACKLINKS ----
    if cfg.is_enabled("appendix_backlinks") and has_senuto:
        max_rows_abl = cfg.get_max_rows("appendix_backlinks", 100)
        abl_data = appendix_backlinks.extract(audit_data, max_rows=max_rows_abl)
        sections_html.append(_render_section("appendix_backlinks", {
            **abl_data,
            "sec_num": next_sec(),
        }))

    # ---- Assemble full HTML ----
    body_content = "\n".join(sections_html)
    base_tmpl = _jinja_env.get_template("base.html")
    full_html = base_tmpl.render(
        css=get_pdf_css(),
        content=body_content,
        audit_url=audit_url,
        audit_url_short=audit_url_short,
        report_label=cfg.label_pl,
        generated_date=generated_date,
    )

    # ---- Convert to PDF ----
    current_time = datetime.utcnow()
    pdf_filename = f"audit_{audit_id}_{report_type}_{current_time.strftime('%Y%m%d_%H%M%S')}.pdf"
    pdf_path = Path(settings.PDF_STORAGE_PATH) / pdf_filename
    pdf_path.parent.mkdir(parents=True, exist_ok=True)

    HTML(string=full_html, base_url=str(_TEMPLATE_DIR)).write_pdf(
        str(pdf_path),
        stylesheets=[CSS(string="")],  # CSS already embedded in <style>
    )

    logger.info(f"✅ PDF generated: {pdf_path} (type: {report_type}, sections: {sec_counter[0] - 1})")
    return str(pdf_path)


def _shorten_url(url: str) -> str:
    """Return URL without scheme for header display."""
    url = re.sub(r"^https?://", "", url)
    return url[:50] + "…" if len(url) > 50 else url
