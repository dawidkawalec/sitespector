"""Data extractor for Executive Summary section."""

from typing import Any, Dict, Optional
from ..utils import safe_get, safe_float, safe_int, health_label_pl, health_color, fmt_ms


def extract(audit_data: Dict[str, Any]) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    exec_summary = results.get("executive_summary") or {}
    roadmap = results.get("roadmap") or {}
    senuto = results.get("senuto") or {}
    vis_dashboard = safe_get(senuto, "visibility", "dashboard") or {}
    senuto_meta = senuto.get("_meta") or {}
    crawl = results.get("crawl") or {}
    lh_desktop = safe_get(results, "lighthouse", "desktop") or {}

    health_status = exec_summary.get("overall_health") or ""
    health_score = safe_float(exec_summary.get("health_score"))
    if not health_status:
        overall = safe_float(audit_data.get("overall_score"))
        if overall >= 80:
            health_status = "good"
        elif overall >= 60:
            health_status = "moderate"
        elif overall >= 40:
            health_status = "poor"
        else:
            health_status = "critical"

    # Overall scores
    overall_score = safe_float(audit_data.get("overall_score"))
    seo_score = safe_float(audit_data.get("seo_score"))
    perf_score = safe_float(audit_data.get("performance_score"))
    content_score = safe_float(audit_data.get("content_score"))

    # Senuto stats
    senuto_stats = None
    if vis_dashboard or senuto_meta.get("positions_count"):
        senuto_stats = {
            "keywords_count": safe_int(senuto_meta.get("positions_count") or vis_dashboard.get("keywords_count")),
            "visibility": safe_float(vis_dashboard.get("visibility")),
            "backlinks_count": safe_int(senuto_meta.get("backlinks_count")),
            "domain_rank": safe_int(vis_dashboard.get("domain_rank")),
            "ads_equivalent": safe_float(vis_dashboard.get("ads_equivalent")),
            "aio_keywords_count": safe_int(senuto_meta.get("ai_overviews_keywords_count")),
            "aio_citations": safe_int(senuto_meta.get("ai_overviews_keywords_count")),
        }

    # Build executive data
    ai_summary = (
        exec_summary.get("summary")
        or safe_get(results, "content_analysis", "summary")
        or ""
    )

    strengths = exec_summary.get("strengths") or []
    critical_issues = exec_summary.get("critical_issues") or []
    top_recommendations = (
        exec_summary.get("next_steps")
        or exec_summary.get("recommendations")
        or []
    )
    growth_potential = exec_summary.get("growth_potential") or exec_summary.get("estimated_impact") or ""

    # Quick stats
    pages_crawled = safe_int(crawl.get("pages_crawled"))
    broken_links = safe_int(safe_get(crawl, "links", "broken"))
    lcp_desktop = fmt_ms(lh_desktop.get("lcp"))

    return {
        "exec": {
            "overall_score": overall_score,
            "seo_score": seo_score,
            "performance_score": perf_score,
            "content_score": content_score,
            "health_status": health_status,
            "health_score": health_score,
            "health_label": health_label_pl(health_status),
            "health_color": health_color(health_status),
            "ai_summary": ai_summary,
            "strengths": strengths,
            "critical_issues": critical_issues,
            "top_recommendations": top_recommendations[:5],
            "growth_potential": growth_potential,
            "senuto_stats": senuto_stats,
            "pages_crawled": pages_crawled,
            "broken_links": broken_links,
            "lcp_desktop": lcp_desktop,
        }
    }
