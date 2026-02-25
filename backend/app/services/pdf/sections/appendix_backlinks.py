"""Data extractor for Appendix - Backlinks."""

from typing import Any, Dict


def extract(audit_data: Dict[str, Any], max_rows: int = 100) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    senuto = results.get("senuto") or {}
    bl_data = senuto.get("backlinks") or {}
    bl_list = bl_data.get("list") or []
    total_count = len(bl_list)
    return {
        "app_bl": {
            "backlinks": bl_list[:max_rows],
            "total_count": total_count,
        }
    }
