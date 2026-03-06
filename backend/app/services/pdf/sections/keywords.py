"""Data extractor for Keywords section."""

from typing import Any, Dict
from ..utils import safe_int, safe_float, safe_get, as_list, senuto_metric_value, pick_first


def extract(audit_data: Dict[str, Any], max_rows: int = 50) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    senuto = results.get("senuto") or {}
    vis = senuto.get("visibility") or {}
    keywords_data = senuto.get("keywords") or {}
    positions = as_list(vis.get("positions")) or as_list(keywords_data.get("positions"))

    # Normalize by volume desc, then position asc
    normalized_positions = []
    for p in positions:
        stats = p.get("statistics") or {}
        intent = (
            p.get("intent")
            or safe_get(stats, "intentions", "main_intent")
            or stats.get("intent")
            or "—"
        )
        difficulty = safe_int(
            pick_first(
                p.get("difficulty"),
                senuto_metric_value(stats.get("difficulty")),
            )
        )
        normalized_positions.append({
            "keyword": p.get("keyword") or "—",
            "position": safe_int(
                pick_first(
                    p.get("position"),
                    senuto_metric_value(stats.get("position")),
                )
            ),
            "search_volume": safe_int(
                pick_first(
                    p.get("search_volume"),
                    p.get("searches"),
                    senuto_metric_value(stats.get("searches")),
                )
            ),
            "intent": intent,
            "difficulty": difficulty,
            "cpc": safe_float(
                pick_first(
                    p.get("cpc"),
                    senuto_metric_value(stats.get("cpc")),
                )
            ),
            "url": (
                p.get("url")
                or safe_get(stats, "url", "current")
                or safe_get(stats, "url", "recent_value")
                or "—"
            ),
        })

    sorted_positions = sorted(
        normalized_positions,
        key=lambda x: (-(safe_int(x.get("search_volume"))), safe_int(x.get("position", 999)))
    )
    top_positions = sorted_positions[:max_rows]

    total_count = len(positions)

    return {
        "kw": {
            "positions": top_positions,
            "total_count": total_count,
        }
    }
