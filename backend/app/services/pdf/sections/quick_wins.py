"""Data extractor for Quick Wins section."""

from typing import Any, Dict, List


def extract(audit_data: Dict[str, Any], max_rows: int = 24) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    quick_wins: List[Dict] = results.get("quick_wins") or []

    # Cap
    quick_wins = quick_wins[:max_rows]

    # Group by impact
    qw_high = [q for q in quick_wins if q.get("impact") == "high"]
    qw_medium = [q for q in quick_wins if q.get("impact") == "medium"]
    qw_low = [q for q in quick_wins if q.get("impact") not in ("high", "medium")]

    # Stats
    easy_effort = sum(1 for q in quick_wins if q.get("effort") == "easy")

    return {
        "qw_high": qw_high,
        "qw_medium": qw_medium,
        "qw_low": qw_low,
        "qw_stats": {
            "total": len(quick_wins),
            "high_impact": len(qw_high),
            "easy_effort": easy_effort,
        },
    }
