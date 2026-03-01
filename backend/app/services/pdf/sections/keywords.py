"""Data extractor for Keywords section."""

from typing import Any, Dict
from ..utils import safe_int, safe_float, as_list


def extract(audit_data: Dict[str, Any], max_rows: int = 50) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    senuto = results.get("senuto") or {}
    vis = senuto.get("visibility") or {}
    positions = as_list(vis.get("positions"))

    # Normalize by volume desc, then position asc
    normalized_positions = []
    for p in positions:
        stats = p.get("statistics") or {}
        normalized_positions.append({
            "keyword": p.get("keyword") or "—",
            "position": safe_int(p.get("position") or stats.get("position")),
            "search_volume": safe_int(p.get("search_volume") or stats.get("search_volume")),
            "intent": p.get("intent") or stats.get("intent") or "—",
            "difficulty": p.get("difficulty") or stats.get("difficulty") or "—",
            "cpc": safe_float(p.get("cpc") or stats.get("cpc")),
            "url": p.get("url") or "—",
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
