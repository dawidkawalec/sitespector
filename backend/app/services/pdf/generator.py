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
    pie_chart,
    horizontal_bar_chart,
    bar_chart,
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


def _safe_extract(fn, *args, **kwargs) -> Optional[Dict]:
    """Call extractor fn, return None on failure (section will be skipped)."""
    try:
        return fn(*args, **kwargs)
    except Exception as e:
        logger.warning(f"Section extractor failed ({fn.__module__}.{fn.__name__}): {e}", exc_info=True)
        return None


def _append_section(sections_html: List[str], template_name: str, data: Optional[Dict], extra: Dict = None) -> bool:
    """Render and append a section. Returns False if data is None (skipped)."""
    if data is None:
        sections_html.append(
            f'<div class="section"><p class="text-muted text-small">Sekcja pominięta z powodu błędu danych: {template_name}</p></div>'
        )
        return False
    ctx = {**(extra or {}), **data}
    sections_html.append(_render_section(template_name, ctx))
    return True


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
        audit_url_display=audit_url_short,
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

    def _sec(sid, fn, *args, template=None, extra=None, **kwargs):
        """Extract + render one section safely. Skips on extractor failure."""
        data = _safe_extract(fn, *args, **kwargs)
        if data is None:
            return
        ctx = {**data, "sec_num": next_sec(), **(extra or {})}
        sections_html.append(_render_section(template or sid, ctx))

    # ---- EXECUTIVE SUMMARY ----
    if cfg.is_enabled("executive_summary"):
        exec_data = _safe_extract(executive_summary.extract, audit_data)
        if exec_data:
            chart_scores = _safe_chart(
                scores_overview_chart,
                exec_data["exec"].get("overall_score") or 0,
                exec_data["exec"].get("seo_score") or 0,
                exec_data["exec"].get("performance_score") or 0,
                exec_data["exec"].get("content_score") or 0,
            )
            sections_html.append(_render_section("executive_summary", {
                **exec_data, "sec_num": next_sec(), "chart_scores": chart_scores,
            }))

    # ---- TECHNICAL OVERVIEW ----
    if cfg.is_enabled("technical_overview"):
        tech_data = _safe_extract(technical_overview.extract, audit_data)
        if tech_data:
            crawl = results.get("crawl") or {}
            chart_http = _safe_chart(http_status_pie, crawl.get("pages_by_status") or {})
            sections_html.append(_render_section("technical_overview", {
                **tech_data, "sec_num": next_sec(), "chart_http_status": chart_http,
            }))

    # ---- ON-PAGE SEO ----
    if cfg.is_enabled("on_page_seo"):
        onpage_data = _safe_extract(on_page_seo.extract, audit_data,
                                    max_rows=cfg.get_max_rows("on_page_seo", 50),
                                    extended=cfg.is_extended("on_page_seo"))
        if onpage_data:
            op = onpage_data["onpage"]
            issues_labels = ["Brak title", "Brak meta desc.", "Brak H1", "Duplikaty title", "Cienki content"]
            issues_values = [
                op.get("missing_titles_count") or 0,
                op.get("missing_descriptions") or 0,
                op.get("missing_h1") or 0,
                op.get("duplicate_title_groups") or 0,
                op.get("thin_content_count") or 0,
            ]
            chart_seo_issues = _safe_chart(
                horizontal_bar_chart,
                issues_labels,
                issues_values,
                title="Problemy On-Page SEO (liczba stron)",
                colors=["#dc2626" if v > 0 else "#16a34a" for v in issues_values],
            ) if any(v > 0 for v in issues_values) else ""
            sections_html.append(_render_section("on_page_seo", {
                **onpage_data, "sec_num": next_sec(),
                "chart_seo_issues": chart_seo_issues,
            }))

    # ---- HEADING ANALYSIS ----
    if cfg.is_enabled("heading_analysis"):
        _sec("heading_analysis", heading_analysis.extract, audit_data,
             extended=cfg.is_extended("heading_analysis"))

    # ---- URL STRUCTURE ----
    if cfg.is_enabled("url_structure"):
        _sec("url_structure", url_structure.extract, audit_data)

    # ---- REDIRECT ANALYSIS ----
    if cfg.is_enabled("redirect_analysis"):
        _sec("redirect_analysis", redirect_analysis.extract, audit_data)

    # ---- STRUCTURED DATA ----
    if cfg.is_enabled("structured_data"):
        _sec("structured_data", structured_data.extract, audit_data)

    # ---- ROBOTS.TXT & SITEMAP ----
    if cfg.is_enabled("robots_sitemap"):
        _sec("robots_sitemap", robots_sitemap.extract, audit_data)

    # ---- INTERNAL LINKS ----
    if cfg.is_enabled("internal_links"):
        _sec("internal_links", internal_links.extract, audit_data,
             max_rows=cfg.get_max_rows("internal_links", 50))

    # ---- PERFORMANCE ----
    if cfg.is_enabled("performance"):
        perf_data = _safe_extract(performance.extract, audit_data)
        if perf_data:
            chart_cwv = _safe_chart(
                cwv_comparison_chart,
                perf_data["perf"].get("desktop_cwv_dict", {}),
                perf_data["perf"].get("mobile_cwv_dict", {}),
            )
            sections_html.append(_render_section("performance", {
                **perf_data, "sec_num": next_sec(), "chart_cwv": chart_cwv,
            }))

    # ---- LIGHTHOUSE DETAIL ----
    if cfg.is_enabled("lighthouse_detail"):
        _sec("lighthouse_detail", lighthouse_detail.extract, audit_data,
             max_rows=cfg.get_max_rows("lighthouse_detail", 15),
             extended=cfg.is_extended("lighthouse_detail"))

    # ---- ACCESSIBILITY ----
    if cfg.is_enabled("accessibility"):
        _sec("accessibility", accessibility.extract, audit_data)

    # ---- SENUTO SECTIONS (conditional) ----
    if has_senuto:
        # Visibility overview
        if cfg.is_enabled("visibility_overview"):
            vis_data = _safe_extract(visibility_overview.extract, audit_data)
            if vis_data:
                chart_kw_dist = _safe_chart(
                    keyword_distribution_chart,
                    vis_data["vis"].get("top3_count", 0),
                    vis_data["vis"].get("top10_count", 0),
                    vis_data["vis"].get("top50_count", 0),
                )
                chart_seasonality = ""
                seasonality = vis_data["vis"].get("seasonality")
                if seasonality and isinstance(seasonality, dict):
                    months = list(seasonality.keys())
                    raw_vals = list(seasonality.values())
                    def _extract_num(v) -> float:
                        if isinstance(v, (int, float)):
                            return float(v)
                        if isinstance(v, dict):
                            for key in ("visibility", "keywords", "value", "count"):
                                if key in v:
                                    try:
                                        return float(v[key])
                                    except (TypeError, ValueError):
                                        pass
                        return 0.0
                    vals = [_extract_num(v) for v in raw_vals]
                    if months and any(v > 0 for v in vals):
                        chart_seasonality = _safe_chart(
                            line_chart, months,
                            [{"label": "Widoczność", "values": vals, "color": "#3b82f6"}],
                            title="Sezonowość widoczności", filled=True,
                        )
                sections_html.append(_render_section("visibility_overview", {
                    **vis_data, "sec_num": next_sec(),
                    "chart_keyword_dist": chart_kw_dist,
                    "chart_seasonality": chart_seasonality,
                }))

        # Keywords
        if cfg.is_enabled("keywords") and "keywords" not in skipped_ids:
            kw_data = _safe_extract(keywords.extract, audit_data,
                                    max_rows=cfg.get_max_rows("keywords", 50))
            if kw_data:
                chart_intent = _safe_chart(intent_distribution_chart,
                                           kw_data["kw"].get("positions", []))
                sections_html.append(_render_section("keywords", {
                    **kw_data, "sec_num": next_sec(),
                    "chart_intent": chart_intent, "chart_difficulty": "",
                }))

        # Position changes
        if cfg.is_enabled("position_changes") and "position_changes" not in skipped_ids:
            _sec("position_changes", position_changes.extract, audit_data,
                 max_rows=cfg.get_max_rows("position_changes", 20))

        # Organic competitors
        if cfg.is_enabled("organic_competitors") and "organic_competitors" not in skipped_ids:
            oc_data = _safe_extract(organic_competitors.extract, audit_data)
            if oc_data:
                chart_comp = _safe_chart(
                    competitor_comparison_chart,
                    oc_data["org_comp"].get("competitors", []),
                    "common_keywords", "Wspólne frazy kluczowe z konkurencją",
                )
                sections_html.append(_render_section("organic_competitors", {
                    **oc_data, "sec_num": next_sec(), "chart_competitors": chart_comp,
                }))

        # Backlinks
        if cfg.is_enabled("backlinks") and "backlinks" not in skipped_ids:
            bl_data = _safe_extract(backlinks.extract, audit_data,
                                    max_rows=cfg.get_max_rows("backlinks", 50))
            if bl_data:
                bl = bl_data["bl"]
                chart_bl_profile = _safe_chart(
                    pie_chart,
                    ["Follow", "Nofollow"],
                    [bl.get("follow_count") or 0, bl.get("nofollow_count") or 0],
                    title="Profil linków",
                    colors=["#16a34a", "#dc2626"],
                ) if (bl.get("follow_count") or bl.get("nofollow_count")) else ""
                ref_domains = bl.get("top_ref_domains") or []
                chart_ref_domains = _safe_chart(
                    bar_chart,
                    [d["domain"][:25] for d in ref_domains[:10]],
                    [d.get("backlinks_count") or 1 for d in ref_domains[:10]],
                    title="Top 10 domen odsyłających (liczba linków)",
                    rotate_labels=True,
                ) if ref_domains else ""
                sections_html.append(_render_section("backlinks", {
                    **bl_data, "sec_num": next_sec(),
                    "chart_bl_profile": chart_bl_profile,
                    "chart_ref_domains": chart_ref_domains,
                }))

        # AI Overviews
        if has_aio and cfg.is_enabled("ai_overviews") and "ai_overviews" not in skipped_ids:
            _sec("ai_overviews", ai_overviews.extract, audit_data,
                 max_rows=cfg.get_max_rows("ai_overviews", 20))

        # Cannibalization
        if cfg.is_enabled("cannibalization"):
            _sec("cannibalization", cannibalization.extract, audit_data)

        # Anchor Text Distribution
        if cfg.is_enabled("anchor_text"):
            _sec("anchor_text", anchor_text.extract, audit_data)

    # ---- CONTENT ----
    if cfg.is_enabled("content"):
        _sec("content", content.extract, audit_data)

    # ---- UX MOBILE ----
    if cfg.is_enabled("ux_mobile"):
        _sec("ux_mobile", ux_mobile.extract, audit_data)

    # ---- SECURITY ----
    if cfg.is_enabled("security"):
        _sec("security", security.extract, audit_data)

    # ---- TECH STACK ----
    if cfg.is_enabled("tech_stack"):
        _sec("tech_stack", tech_stack.extract, audit_data)

    # ---- AI INSIGHTS PER AREA ----
    if cfg.is_enabled("ai_insights"):
        _sec("ai_insights", ai_insights.extract, audit_data,
             extended=cfg.is_extended("ai_insights"))

    # ---- CROSS-TOOL ----
    if cfg.is_enabled("cross_tool"):
        _sec("cross_tool", cross_tool.extract, audit_data)

    # ---- QUICK WINS ----
    if cfg.is_enabled("quick_wins"):
        max_rows_qw = cfg.get_max_rows("quick_wins", 24)
        qw_data = _safe_extract(quick_wins.extract, audit_data, max_rows=max_rows_qw)
        if qw_data:
            all_qw = qw_data.get("qw_high", []) + qw_data.get("qw_medium", []) + qw_data.get("qw_low", [])
            chart_matrix = _safe_chart(impact_effort_matrix, all_qw)
            sections_html.append(_render_section("quick_wins", {
                **qw_data, "sec_num": next_sec(), "chart_matrix": chart_matrix,
            }))

    # ---- ROADMAP ----
    immediate_only = cfg.is_enabled("roadmap_immediate") and not cfg.is_enabled("roadmap_full")
    roadmap_section_id = "roadmap_immediate" if immediate_only else "roadmap_full"
    if cfg.is_enabled(roadmap_section_id):
        rm_data = _safe_extract(roadmap.extract, audit_data, immediate_only=immediate_only)
        if rm_data:
            chart_rm = _safe_chart(roadmap_timeline_chart, rm_data.get("roadmap", {}))
            sections_html.append(_render_section("roadmap", {
                **rm_data, "sec_num": next_sec(), "chart_roadmap": chart_rm,
            }))

    # ---- EXECUTION PLAN ----
    if cfg.is_enabled("execution_plan"):
        max_rows_ep = cfg.get_max_rows("execution_plan", 30)
        extended_ep = cfg.is_extended("execution_plan")
        ep_data = _safe_extract(execution_plan.extract, audit_data,
                                tasks=tasks_list, max_rows=max_rows_ep, extended=extended_ep)
        if ep_data:
            all_tasks_for_chart = tasks_list[:max_rows_ep] if not extended_ep else tasks_list
            chart_priority = _safe_chart(execution_plan_priority_chart, all_tasks_for_chart)
            sections_html.append(_render_section("execution_plan", {
                **ep_data, "sec_num": next_sec(), "chart_priority": chart_priority,
            }))

    # ---- BENCHMARK ----
    if cfg.is_enabled("benchmark"):
        _sec("benchmark", benchmark.extract, audit_data)

    # ---- APPENDIX PAGES ----
    if cfg.is_enabled("appendix_pages"):
        _sec("appendix_pages", appendix_pages.extract, audit_data,
             max_rows=cfg.get_max_rows("appendix_pages"))

    # ---- APPENDIX IMAGES ----
    if cfg.is_enabled("appendix_images"):
        _sec("appendix_images", appendix_images.extract, audit_data,
             max_rows=cfg.get_max_rows("appendix_images", 100))

    # ---- APPENDIX KEYWORDS ----
    if cfg.is_enabled("appendix_keywords") and has_senuto:
        _sec("appendix_keywords", appendix_keywords.extract, audit_data,
             max_rows=cfg.get_max_rows("appendix_keywords", 200))

    # ---- APPENDIX BACKLINKS ----
    if cfg.is_enabled("appendix_backlinks") and has_senuto:
        _sec("appendix_backlinks", appendix_backlinks.extract, audit_data,
             max_rows=cfg.get_max_rows("appendix_backlinks", 100))

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
