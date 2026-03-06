"""Data extractor for Soft 404 and low-content section."""

from typing import Any, Dict

from ..utils import safe_int


def extract(audit_data: Dict[str, Any], max_rows: int = 30) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    crawl = results.get("crawl") or {}
    soft = crawl.get("soft_404") or {}

    return {
        "soft": {
            "has_data": bool(soft),
            "soft_404_count": safe_int(soft.get("soft_404_count")),
            "low_content_count": safe_int(soft.get("low_content_count")),
            "has_issues": bool(soft.get("has_issues")),
            "issues": soft.get("issues") or [],
            "soft_404_samples": (soft.get("soft_404_samples") or [])[:max_rows],
            "low_content_samples": (soft.get("low_content_samples") or [])[:max_rows],
        }
    }
