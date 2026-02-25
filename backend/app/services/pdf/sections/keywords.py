"""Data extractor for Keywords section."""

from typing import Any, Dict
from ..utils import safe_int, safe_float


def extract(audit_data: Dict[str, Any], max_rows: int = 50) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    senuto = results.get("senuto") or {}
    vis = senuto.get("visibility") or {}
    positions = vis.get("positions") or []

    # Sort by volume desc, then position asc
    sorted_positions = sorted(
        positions,
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
