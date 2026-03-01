"""Data extractor for Appendix - Backlinks."""

from typing import Any, Dict
from ..utils import as_list


def extract(audit_data: Dict[str, Any], max_rows: int = 100) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    senuto = results.get("senuto") or {}
    bl_data = senuto.get("backlinks") or {}
    bl_list = as_list(bl_data.get("list") or bl_data.get("backlinks"))
    total_count = len(bl_list)

    def _normalize(item: Dict) -> Dict:
        rel_raw = item.get("rel") or item.get("link_attributes") or []
        if isinstance(rel_raw, list):
            rel_str = ", ".join(rel_raw)
        else:
            rel_str = str(rel_raw)

        return {
            "url": item.get("ref_url") or item.get("source_url") or item.get("url") or "—",
            "domain": item.get("ref_domain") or item.get("source_domain") or item.get("domain") or "—",
            "anchor": item.get("anchor") or item.get("anchor_text") or "(brak)",
            "type": item.get("link_type") or item.get("type") or "—",
            "rel": rel_str or "follow",
        }

    normalized = [_normalize(item) for item in bl_list[:max_rows]]

    return {
        "app_bl": {
            "backlinks": normalized,
            "total_count": total_count,
        }
    }
