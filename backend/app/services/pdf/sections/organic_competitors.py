"""Data extractor for Organic Competitors section."""

from typing import Any, Dict
from ..utils import safe_float, safe_int, as_list, senuto_metric_value, pick_first


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
        if comp.get("is_main_domain") is True:
            continue
        stats = comp.get("statistics") or {}
        normalized_competitors.append({
            "domain": comp.get("domain") or comp.get("domain_name") or "—",
            "common_keywords": safe_int(comp.get("common_keywords") or comp.get("common_keywords_count")),
            "visibility": safe_float(
                pick_first(
                    comp.get("visibility"),
                    comp.get("visibility_score"),
                    senuto_metric_value(stats.get("visibility")),
                )
            ),
            "top3": safe_int(
                pick_first(
                    comp.get("top3"),
                    comp.get("top3_count"),
                    senuto_metric_value(stats.get("top3")),
                )
            ),
            "top10": safe_int(
                pick_first(
                    comp.get("top10"),
                    comp.get("top10_count"),
                    senuto_metric_value(stats.get("top10")),
                )
            ),
            "domain_rank": safe_int(
                pick_first(
                    comp.get("domain_rank"),
                    comp.get("rank"),
                    senuto_metric_value(stats.get("domain_rank")),
                )
            ),
        })
    normalized_competitors = sorted(
        normalized_competitors,
        key=lambda c: (-(c.get("common_keywords") or 0), -(c.get("visibility") or 0)),
    )

    return {
        "org_comp": {
            "competitors": normalized_competitors[:15],
            "ai_opportunities": vis_ai.get("competitor_gaps") or vis_ai.get("opportunities") or [],
            "non_technical_summary": vis_ai.get("non_technical_summary") or "",
            "metrics_legend": vis_ai.get("metrics_legend") or [],
            "next_steps_for_management": vis_ai.get("next_steps_for_management") or [],
        }
    }
