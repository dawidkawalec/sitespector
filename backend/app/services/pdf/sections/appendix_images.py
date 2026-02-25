"""Data extractor for Appendix - Images."""

from typing import Any, Dict


def extract(audit_data: Dict[str, Any], max_rows: int = 100) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    crawl = results.get("crawl") or {}
    images_data = crawl.get("images") or {}
    all_images = images_data.get("all_images") or []
    total_count = len(all_images)
    images = all_images[:max_rows]
    return {
        "app_img": {
            "images": images,
            "total_count": total_count,
        }
    }
