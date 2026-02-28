"""Data extractor for Roadmap section."""

from typing import Any, Dict
from ..utils import as_list


def extract(audit_data: Dict[str, Any], immediate_only: bool = False) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    rm = results.get("roadmap") or {}

    roadmap = {
        "immediate_actions": as_list(rm.get("immediate_actions")),
        "short_term": [] if immediate_only else as_list(rm.get("short_term")),
        "medium_term": [] if immediate_only else as_list(rm.get("medium_term")),
        "long_term": [] if immediate_only else as_list(rm.get("long_term")),
    }

    return {"roadmap": roadmap}
