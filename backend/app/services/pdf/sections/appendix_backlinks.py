"""Data extractor for Appendix - Backlinks."""

from typing import Any, Dict
from ..utils import as_list


def extract(audit_data: Dict[str, Any], max_rows: int = 100) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    senuto = results.get("senuto") or {}
    bl_data = senuto.get("backlinks") or {}
    bl_list = as_list(bl_data.get("list") or bl_data.get("backlinks"))
    total_count = len(bl_list)
    return {
        "app_bl": {
            "backlinks": bl_list[:max_rows],
            "total_count": total_count,
        }
    }
