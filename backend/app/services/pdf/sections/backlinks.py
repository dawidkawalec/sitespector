"""Data extractor for Backlinks section."""

from typing import Any, Dict
from ..utils import safe_float, safe_int, as_list


def extract(audit_data: Dict[str, Any], max_rows: int = 50) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    senuto = results.get("senuto") or {}
    bl_data = senuto.get("backlinks") or {}
    stats = bl_data.get("statistics") or {}
    ai_contexts = results.get("ai_contexts") or {}
    bl_ai = ai_contexts.get("backlinks") or {}

    total_backlinks = safe_int(stats.get("backlinks_count") or stats.get("total"))
    ref_domains = safe_int(stats.get("ref_domains_count") or stats.get("domains_count"))
    ref_ips = safe_int(stats.get("ref_ips_count"))

    # Link attributes
    link_attrs = bl_data.get("link_attributes") or {}
    follow_count = safe_int(link_attrs.get("follow") or link_attrs.get("dofollow"))
    nofollow_count = safe_int(link_attrs.get("nofollow"))
    follow_pct = (follow_count / total_backlinks * 100) if total_backlinks else 0
    nofollow_pct = (nofollow_count / total_backlinks * 100) if total_backlinks else 0

    # Anchors
    anchors_raw = as_list(bl_data.get("anchors"))
    top_anchors = []
    for a in anchors_raw[:20]:
        if isinstance(a, dict):
            top_anchors.append({
                "anchor": a.get("anchor") or a.get("text") or "",
                "count": safe_int(a.get("count") or a.get("backlinks_count")),
            })

    # Ref domains
    ref_domains_list = as_list(bl_data.get("ref_domains"))
    normalized_ref_domains = []
    for rd in ref_domains_list:
        normalized_ref_domains.append({
            "domain": rd.get("domain") or rd.get("domain_name") or rd.get("ref_domain") or "—",
            "backlinks_count": safe_int(rd.get("backlinks_count") or rd.get("count") or 1),
        })
    top_ref_domains = normalized_ref_domains[:max_rows]

    return {
        "bl": {
            "backlinks_count": total_backlinks,
            "ref_domains_count": ref_domains,
            "ref_ips_count": ref_ips,
            "follow_count": follow_count,
            "nofollow_count": nofollow_count,
            "follow_pct": follow_pct,
            "nofollow_pct": nofollow_pct,
            "top_anchors": top_anchors,
            "top_ref_domains": top_ref_domains,
            "ai_key_findings": bl_ai.get("key_findings") or [],
            "ai_recommendations": bl_ai.get("recommendations") or [],
        }
    }
