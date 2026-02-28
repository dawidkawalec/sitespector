"""Data extractor for Anchor Text Distribution section."""

from typing import Any, Dict, List
from ..utils import safe_int, as_list


def extract(audit_data: Dict[str, Any]) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    senuto = results.get("senuto") or {}
    backlinks_data = senuto.get("backlinks") or {}

    # Anchor text from Senuto backlinks — may be list or dict
    anchors_raw = backlinks_data.get("anchors")
    if isinstance(anchors_raw, list):
        anchor_list = anchors_raw
    elif isinstance(anchors_raw, dict):
        anchor_list = as_list(anchors_raw.get("data") or anchors_raw.get("anchors"))
    else:
        anchor_list = []

    # Process anchor text data
    anchors = []
    total_links = 0
    branded_count = 0
    exact_match_count = 0
    generic_count = 0
    naked_url_count = 0

    audit_url = audit_data.get("url", "")
    # Extract domain name for branded detection
    try:
        from urllib.parse import urlparse
        domain_parts = urlparse(audit_url).netloc.replace("www.", "").split(".")
        brand_name = domain_parts[0].lower() if domain_parts else ""
    except Exception:
        brand_name = ""

    for item in anchor_list:
        anchor = item.get("anchor") or item.get("text") or item.get("anchor_text") or ""
        count = safe_int(item.get("backlinks_count") or item.get("count") or item.get("links_count") or 1)
        domains = safe_int(item.get("domains_count") or item.get("domains") or 0)

        if not anchor:
            continue

        anchor_lower = anchor.lower().strip()
        anchor_type = "other"
        if not anchor or anchor_lower in ("click here", "here", "this", "link", "więcej", "czytaj", "read more", "learn more"):
            anchor_type = "generic"
            generic_count += count
        elif brand_name and brand_name in anchor_lower:
            anchor_type = "branded"
            branded_count += count
        elif anchor_lower.startswith("http"):
            anchor_type = "naked_url"
            naked_url_count += count
        else:
            anchor_type = "exact_match"
            exact_match_count += count

        total_links += count
        anchors.append({
            "anchor": anchor[:60],
            "count": count,
            "domains": domains,
            "type": anchor_type,
        })

    anchors.sort(key=lambda x: -x["count"])

    # Distribution percentages
    def pct(n):
        return round(n / total_links * 100, 1) if total_links > 0 else 0

    distribution = {
        "branded": {"count": branded_count, "pct": pct(branded_count)},
        "exact_match": {"count": exact_match_count, "pct": pct(exact_match_count)},
        "naked_url": {"count": naked_url_count, "pct": pct(naked_url_count)},
        "generic": {"count": generic_count, "pct": pct(generic_count)},
    }

    return {
        "anchor": {
            "has_data": bool(anchors),
            "total_anchors": len(anchors),
            "total_links": total_links,
            "top_anchors": anchors[:40],
            "distribution": distribution,
            "brand_name": brand_name,
        }
    }
