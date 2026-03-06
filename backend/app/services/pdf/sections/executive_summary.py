"""Data extractor for Executive Summary section."""

from typing import Any, Dict, Optional
from ..utils import safe_get, safe_float, safe_int, health_label_pl, health_color, fmt_ms, as_list, senuto_metric_value, pick_first


def extract(audit_data: Dict[str, Any]) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    exec_summary = results.get("executive_summary") or {}
    roadmap = results.get("roadmap") or {}
    senuto = results.get("senuto") or {}
    visibility = senuto.get("visibility") or {}
    vis_dashboard = visibility.get("dashboard") or {}
    vis_stats = safe_get(visibility, "statistics", "statistics") or {}
    aio_stats = safe_get(visibility, "ai_overviews", "statistics") or {}
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
    if vis_stats or vis_dashboard or senuto_meta.get("positions_count"):
        senuto_stats = {
            "keywords_count": safe_int(
                pick_first(
                    senuto_meta.get("positions_count"),
                    vis_dashboard.get("keywords_count"),
                    senuto_metric_value(vis_stats.get("top50")),
                )
            ),
            "visibility": safe_float(
                pick_first(
                    senuto_metric_value(vis_stats.get("visibility")),
                    vis_dashboard.get("visibility"),
                )
            ),
            "backlinks_count": safe_int(senuto_meta.get("backlinks_count")),
            "domain_rank": safe_int(
                pick_first(
                    senuto_metric_value(vis_stats.get("domain_rank")),
                    vis_dashboard.get("domain_rank"),
                )
            ),
            "ads_equivalent": safe_float(
                pick_first(
                    senuto_metric_value(vis_stats.get("ads_equivalent")),
                    vis_dashboard.get("ads_equivalent"),
                )
            ),
            "aio_keywords_count": safe_int(
                pick_first(
                    senuto_meta.get("ai_overviews_keywords_count"),
                    aio_stats.get("aio_keywords_count"),
                    aio_stats.get("total_keywords"),
                )
            ),
            "aio_citations": safe_int(
                pick_first(
                    aio_stats.get("aio_keywords_with_domain_count"),
                    aio_stats.get("citations_count"),
                    senuto_meta.get("ai_overviews_keywords_count"),
                )
            ),
        }

    # Build executive data
    ai_summary = (
        exec_summary.get("summary")
        or safe_get(results, "content_analysis", "summary")
        or ""
    )

    strengths = as_list(exec_summary.get("strengths"))
    critical_issues = as_list(exec_summary.get("critical_issues"))
    top_recommendations = as_list(
        exec_summary.get("next_steps") or exec_summary.get("recommendations")
    )
    growth_potential = exec_summary.get("growth_potential") or exec_summary.get("estimated_impact") or ""

    if senuto_stats and safe_float(senuto_stats.get("visibility")) > 0:
        # Remove stale issue text from legacy snapshots once visibility mapping is correct.
        critical_issues = [
            issue for issue in critical_issues
            if not (
                isinstance(issue, str)
                and "widoczno" in issue.lower()
                and ("0.0" in issue or "snapshot" in issue.lower())
            )
        ]

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
