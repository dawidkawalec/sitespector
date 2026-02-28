"""Data extractor for Cross-Tool Analysis section."""

from typing import Any, Dict
from ..utils import as_list


def extract(audit_data: Dict[str, Any]) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    ct = results.get("cross_tool") or {}

    return {
        "ct": {
            "correlations": as_list(ct.get("correlations")),
            "synergies": as_list(ct.get("synergies")),
            "conflicts": as_list(ct.get("conflicts")),
            "unified_recommendations": as_list(ct.get("unified_recommendations")),
        }
    }
