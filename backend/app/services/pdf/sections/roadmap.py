"""Data extractor for Roadmap section."""

from typing import Any, Dict


def extract(audit_data: Dict[str, Any], immediate_only: bool = False) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    rm = results.get("roadmap") or {}

    roadmap = {
        "immediate_actions": rm.get("immediate_actions") or [],
        "short_term": [] if immediate_only else (rm.get("short_term") or []),
        "medium_term": [] if immediate_only else (rm.get("medium_term") or []),
        "long_term": [] if immediate_only else (rm.get("long_term") or []),
    }

    return {"roadmap": roadmap}
