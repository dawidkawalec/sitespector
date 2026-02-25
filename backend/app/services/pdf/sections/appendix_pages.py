"""Data extractor for Appendix - Pages."""

from typing import Any, Dict


def extract(audit_data: Dict[str, Any], max_rows: int = None) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    crawl = results.get("crawl") or {}
    all_pages = crawl.get("all_pages") or []
    total_count = len(all_pages)
    pages = all_pages if max_rows is None else all_pages[:max_rows]
    return {
        "app": {
            "pages": pages,
            "total_count": total_count,
        }
    }
