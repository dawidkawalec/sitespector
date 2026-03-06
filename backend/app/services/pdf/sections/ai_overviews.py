"""Data extractor for AI Overviews section."""

from typing import Any, Dict
from ..utils import safe_float, safe_int, as_list, safe_get, pick_first


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
        normalized_keywords.append({
            "keyword": kw.get("keyword") or "—",
            "search_volume": safe_int(
                pick_first(
                    kw.get("search_volume"),
                    kw.get("searches"),
                    safe_get(kw, "statistics", "search_volume"),
                )
            ),
            "organic_position": safe_int(
                pick_first(
                    kw.get("organic_position"),
                    kw.get("organic_pos"),
                    kw.get("position"),
                    safe_get(kw, "statistics", "organic_position"),
                )
            ),
            "best_aio_position": safe_int(
                pick_first(
                    kw.get("best_aio_position"),
                    kw.get("best_aio_pos"),
                    kw.get("best_position"),
                    safe_get(kw, "statistics", "best_aio_position"),
                )
            ),
            "intent": (
                kw.get("intent")
                or safe_get(kw, "intentions", "main_intent")
                or safe_get(kw, "statistics", "intent")
                or "—"
            ),
        })
    normalized_keywords = sorted(
        normalized_keywords,
        key=lambda row: (-(row.get("search_volume") or 0), row.get("best_aio_position") or 999),
    )

    return {
        "aio": {
            "citations_count": safe_int(
                pick_first(
                    aio_stats.get("aio_keywords_with_domain_count"),
                    aio_stats.get("citations_count"),
                    aio_stats.get("total_keywords"),
                )
            ),
            "avg_position": safe_float(
                pick_first(
                    aio_stats.get("aio_avg_pos"),
                    aio_stats.get("avg_position"),
                )
            ),
            "keywords_count": safe_int(
                pick_first(
                    aio_stats.get("aio_keywords_count"),
                    aio_stats.get("total_keywords"),
                    len(aio_keywords),
                )
            ),
            "keywords": normalized_keywords[:max_rows],
            "ai_summary": aio_ai.get("summary") or "",
            "aio_opportunities": aio_ai.get("aio_opportunities") or aio_ai.get("recommendations") or [],
        }
    }
