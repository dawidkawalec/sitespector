"""Data extractor for Appendix - Keywords."""

from typing import Any, Dict


def extract(audit_data: Dict[str, Any], max_rows: int = 200) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    senuto = results.get("senuto") or {}
    vis = senuto.get("visibility") or {}
    positions = vis.get("positions") or []
    total_count = len(positions)
    # Sort by volume then position
    sorted_kw = sorted(
        positions,
        key=lambda x: (-(x.get("search_volume") or 0), x.get("position") or 999)
    )
    return {
        "app_kw": {
            "keywords": sorted_kw[:max_rows],
            "total_count": total_count,
        }
    }
