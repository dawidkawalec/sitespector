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

    # Normalize competitor fields (Senuto often uses different keys)
    normalized_competitors = []
    for comp in competitors:
        # Dashboard data might be nested or named differently
        normalized_competitors.append({
            "domain": comp.get("domain") or comp.get("domain_name") or "—",
            "common_keywords": safe_int(comp.get("common_keywords") or comp.get("common_keywords_count")),
            "visibility": safe_float(comp.get("visibility") or comp.get("visibility_score")),
            "top3": safe_int(comp.get("top3") or comp.get("top3_count")),
            "top10": safe_int(comp.get("top10") or comp.get("top10_count")),
            "domain_rank": safe_int(comp.get("domain_rank") or comp.get("rank")),
        })

    return {
        "org_comp": {
            "competitors": normalized_competitors[:15],
            "ai_opportunities": vis_ai.get("competitor_gaps") or vis_ai.get("opportunities") or [],
        }
    }
