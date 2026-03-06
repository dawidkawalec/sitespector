"""Data extractor for directives / hreflang / nofollow section."""

from typing import Any, Dict

from ..utils import safe_int


def extract(audit_data: Dict[str, Any], max_rows: int = 30) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    crawl = results.get("crawl") or {}
    directives = crawl.get("directives_hreflang") or {}

    return {
        "dh": {
            "has_data": bool(directives),
            "noindex_count": safe_int(directives.get("noindex_count")),
            "nofollow_count": safe_int(directives.get("nofollow_count")),
            "x_robots_count": safe_int(directives.get("x_robots_count")),
            "hreflang_count": safe_int(directives.get("hreflang_count")),
            "hreflang_empty_count": safe_int(directives.get("hreflang_empty_count")),
            "issues": directives.get("issues") or [],
            "has_issues": bool(directives.get("has_issues")),
            "directives_samples": (directives.get("directives_samples") or [])[:max_rows],
            "hreflang_samples": (directives.get("hreflang_samples") or [])[:max_rows],
        }
    }
