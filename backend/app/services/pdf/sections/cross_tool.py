"""Data extractor for Cross-Tool Analysis section."""

from typing import Any, Dict


def extract(audit_data: Dict[str, Any]) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    ct = results.get("cross_tool") or {}

    return {
        "ct": {
            "correlations": ct.get("correlations") or [],
            "synergies": ct.get("synergies") or [],
            "conflicts": ct.get("conflicts") or [],
            "unified_recommendations": ct.get("unified_recommendations") or [],
        }
    }
