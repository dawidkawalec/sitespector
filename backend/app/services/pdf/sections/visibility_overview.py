"""Data extractor for Visibility Overview section."""

from typing import Any, Dict
from ..utils import safe_float, safe_int, safe_get, as_list, senuto_metric_value, pick_first


def extract(audit_data: Dict[str, Any]) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    senuto = results.get("senuto") or {}
    vis = senuto.get("visibility") or {}
    dashboard = vis.get("dashboard") or {}
    vis_stats = safe_get(vis, "statistics", "statistics") or {}
    meta = senuto.get("_meta") or {}
    ai_contexts = results.get("ai_contexts") or {}
    vis_ai = ai_contexts.get("visibility") or {}
    aio = vis.get("ai_overviews") or {}
    aio_stats = aio.get("statistics") or {}

    # Position distribution (top3, top10, top50)
    positions = as_list(vis.get("positions"))
    top3_count = 0
    top10_count = 0
    top50_count = 0
    
    for p in positions:
        stats = p.get("statistics") or {}
        pos = safe_int(
            pick_first(
                p.get("position"),
                senuto_metric_value(stats.get("position")),
            )
        )
        if pos > 0:
            top50_count += 1
            if pos <= 3:
                top3_count += 1
            if pos <= 10:
                top10_count += 1

    stats_top3 = safe_int(senuto_metric_value(vis_stats.get("top3")))
    stats_top10 = safe_int(senuto_metric_value(vis_stats.get("top10")))
    stats_top50 = safe_int(senuto_metric_value(vis_stats.get("top50")))
    top3_count = stats_top3 or top3_count
    top10_count = stats_top10 or top10_count
    top50_count = stats_top50 or top50_count

    # Sections
    sections_raw = as_list(vis.get("sections_urls") or vis.get("sections"))
    normalized_sections = []
    for sec in sections_raw:
        sec_stats = sec.get("statistics") or {}
        normalized_sections.append({
            "section": sec.get("section") or sec.get("path") or sec.get("url") or "—",
            "keywords_count": safe_int(
                pick_first(
                    sec.get("keywords_count"),
                    sec.get("keywords_top10"),
                    sec.get("count"),
                    senuto_metric_value(sec_stats.get("top10")),
                )
            ),
            "estimated_traffic": safe_int(
                pick_first(
                    sec.get("estimated_traffic"),
                    sec.get("traffic"),
                    senuto_metric_value(sec_stats.get("visibility")),
                )
            ),
        })

    # Seasonality data for chart
    seasonality = vis.get("seasonality") or {}

    return {
        "vis": {
            "keywords_count": safe_int(
                pick_first(
                    meta.get("positions_count"),
                    dashboard.get("keywords_count"),
                    top50_count,
                )
            ),
            "top3_count": top3_count,
            "top10_count": top10_count,
            "top50_count": top50_count,
            "domain_rank": safe_int(
                pick_first(
                    senuto_metric_value(vis_stats.get("domain_rank")),
                    dashboard.get("domain_rank"),
                )
            ),
            "visibility": safe_float(
                pick_first(
                    senuto_metric_value(vis_stats.get("visibility")),
                    dashboard.get("visibility"),
                )
            ),
            "ads_equivalent": safe_float(
                pick_first(
                    senuto_metric_value(vis_stats.get("ads_equivalent")),
                    dashboard.get("ads_equivalent"),
                )
            ),
            "clicks_equivalent": safe_float(dashboard.get("clicks_equivalent")),
            "aio_keywords_count": safe_int(
                pick_first(
                    meta.get("ai_overviews_keywords_count"),
                    aio_stats.get("aio_keywords_count"),
                    aio_stats.get("total_keywords"),
                    len(as_list(aio.get("keywords"))),
                )
            ),
            "aio_citations": safe_int(
                pick_first(
                    aio_stats.get("aio_keywords_with_domain_count"),
                    aio_stats.get("citations_count"),
                    aio_stats.get("total_keywords"),
                )
            ),
            "ai_summary": vis_ai.get("summary") or vis_ai.get("non_technical_summary") or "",
            "ai_key_findings": vis_ai.get("key_findings") or [],
            "keyword_opportunities": vis_ai.get("keyword_opportunities") or [],
            "metrics_legend": vis_ai.get("metrics_legend") or [],
            "management_next_steps": vis_ai.get("next_steps_for_management") or [],
            "non_technical_summary": vis_ai.get("non_technical_summary") or "",
            "sections": normalized_sections[:20],
            "seasonality": seasonality,
            "positions_raw": positions,
        }
    }
