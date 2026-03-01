"""Data extractor for AI Overviews section."""

from typing import Any, Dict
from ..utils import safe_float, safe_int, as_list


def extract(audit_data: Dict[str, Any], max_rows: int = 30) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    senuto = results.get("senuto") or {}
    vis = senuto.get("visibility") or {}
    aio = vis.get("ai_overviews") or {}
    aio_stats = aio.get("statistics") or {}
    aio_keywords = as_list(aio.get("keywords"))
    ai_contexts = results.get("ai_contexts") or {}
    aio_ai = ai_contexts.get("ai_overviews") or {}

    # Normalize AIO keyword fields
    normalized_keywords = []
    for kw in aio_keywords:
        # Senuto often nests these in 'statistics'
        stats = kw.get("statistics") or {}
        normalized_keywords.append({
            "keyword": kw.get("keyword") or "—",
            "search_volume": safe_int(kw.get("search_volume") or stats.get("search_volume")),
            "organic_position": safe_int(kw.get("organic_position") or stats.get("organic_position") or kw.get("position")),
            "best_aio_position": safe_int(kw.get("best_aio_position") or stats.get("best_aio_position") or kw.get("best_position")),
            "intent": kw.get("intent") or stats.get("intent") or "—",
        })

    return {
        "aio": {
            "citations_count": safe_int(aio_stats.get("citations_count") or aio_stats.get("total_keywords")),
            "avg_position": safe_float(aio_stats.get("avg_position")),
            "keywords_count": safe_int(aio_stats.get("total_keywords") or len(aio_keywords)),
            "keywords": normalized_keywords[:max_rows],
            "ai_summary": aio_ai.get("summary") or "",
            "aio_opportunities": aio_ai.get("aio_opportunities") or aio_ai.get("recommendations") or [],
        }
    }
