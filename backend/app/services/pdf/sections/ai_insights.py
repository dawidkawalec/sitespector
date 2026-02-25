"""Data extractor for AI Insights per Area section."""

from typing import Any, Dict


AREA_ORDER = [
    "seo", "performance", "visibility", "backlinks", "ai_overviews",
    "links", "images", "security", "ux",
]


def extract(audit_data: Dict[str, Any], extended: bool = False) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    ai_contexts = results.get("ai_contexts") or {}

    # Ordered dict
    ordered_contexts = {}
    for area in AREA_ORDER:
        ctx = ai_contexts.get(area)
        if ctx and isinstance(ctx, dict):
            ordered_contexts[area] = ctx

    # Also include any extra areas not in AREA_ORDER
    for area, ctx in ai_contexts.items():
        if area not in ordered_contexts and ctx and isinstance(ctx, dict):
            ordered_contexts[area] = ctx

    return {
        "ai_contexts": ordered_contexts,
        "extended": extended,
    }
