"""Data extractor for Visibility Overview section."""

from typing import Any, Dict
from ..utils import safe_float, safe_int, safe_get, as_list


def extract(audit_data: Dict[str, Any]) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    senuto = results.get("senuto") or {}
    vis = senuto.get("visibility") or {}
    dashboard = vis.get("dashboard") or {}
    meta = senuto.get("_meta") or {}
    ai_contexts = results.get("ai_contexts") or {}
    vis_ai = ai_contexts.get("visibility") or {}
    aio = vis.get("ai_overviews") or {}
    aio_stats = aio.get("statistics") or {}

    # Position distribution (top3, top10, top50)
    positions = as_list(vis.get("positions"))
    top3_count = sum(1 for p in positions if safe_int(p.get("position")) <= 3)
    top10_count = sum(1 for p in positions if safe_int(p.get("position")) <= 10)
    top50_count = len(positions)

    # Sections
    sections_urls = as_list(vis.get("sections_urls") or vis.get("sections"))

    # Seasonality data for chart
    seasonality = vis.get("seasonality") or {}

    return {
        "vis": {
            "keywords_count": safe_int(meta.get("positions_count") or dashboard.get("keywords_count") or top50_count),
            "top3_count": top3_count,
            "top10_count": top10_count,
            "top50_count": top50_count,
            "domain_rank": safe_int(dashboard.get("domain_rank")),
            "visibility": safe_float(dashboard.get("visibility")),
            "ads_equivalent": safe_float(dashboard.get("ads_equivalent")),
            "clicks_equivalent": safe_float(dashboard.get("clicks_equivalent")),
            "aio_keywords_count": safe_int(meta.get("ai_overviews_keywords_count") or aio_stats.get("total_keywords")),
            "aio_citations": safe_int(aio_stats.get("citations_count")),
            "ai_summary": vis_ai.get("summary") or "",
            "ai_key_findings": vis_ai.get("key_findings") or [],
            "keyword_opportunities": vis_ai.get("keyword_opportunities") or [],
            "sections": sections_urls[:20],
            "seasonality": seasonality,
            "positions_raw": positions,
        }
    }
