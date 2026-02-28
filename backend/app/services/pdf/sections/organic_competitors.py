"""Data extractor for Organic Competitors section."""

from typing import Any, Dict
from ..utils import safe_float, safe_int, as_list


def extract(audit_data: Dict[str, Any]) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    senuto = results.get("senuto") or {}
    vis = senuto.get("visibility") or {}
    competitors = as_list(vis.get("competitors"))
    ai_contexts = results.get("ai_contexts") or {}
    vis_ai = ai_contexts.get("visibility") or {}

    return {
        "org_comp": {
            "competitors": competitors[:15],
            "ai_opportunities": vis_ai.get("competitor_gaps") or vis_ai.get("opportunities") or [],
        }
    }
