"""Data extractor for URL Structure Analysis section."""

import re
from typing import Any, Dict, List
from urllib.parse import urlparse, unquote
from ..utils import safe_int


def _analyze_url(url: str) -> Dict:
    """Analyze a single URL for SEO issues."""
    try:
        parsed = urlparse(url)
        path = parsed.path or "/"
        segments = [s for s in path.split("/") if s]
        depth = len(segments)

        issues = []

        # Length check
        if len(url) > 100:
            issues.append("zbyt_dlugi")

        # Non-ASCII characters
        if any(ord(c) > 127 for c in path):
            issues.append("nieasciis")

        # Uppercase letters
        if any(c.isupper() for c in path):
            issues.append("wielkie_litery")

        # Underscores (Google prefers hyphens)
        if "_" in path:
            issues.append("podkreslenia")

        # Query parameters
        if parsed.query:
            issues.append("parametry_query")

        # Double slashes
        if "//" in path:
            issues.append("podwojne_slashe")

        # Very deep (5+ levels)
        if depth >= 5:
            issues.append("zbyt_glebokie")

        # Numeric-only segments
        if any(s.isdigit() for s in segments):
            issues.append("segmenty_numeryczne")

        return {
            "url": url,
            "depth": depth,
            "length": len(url),
            "issues": issues,
            "path": path,
        }
    except Exception:
        return {"url": url, "depth": 0, "length": len(url), "issues": [], "path": ""}


def extract(audit_data: Dict[str, Any]) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    crawl = results.get("crawl") or {}
    all_pages = crawl.get("all_pages") or []

    indexable = [p for p in all_pages if p.get("status_code") == 200]

    # Analyze all URLs
    analyzed = [_analyze_url(p.get("url", "")) for p in indexable]

    # Categorize issues
    too_long = [a for a in analyzed if "zbyt_dlugi" in a["issues"]]
    non_ascii = [a for a in analyzed if "nieasciis" in a["issues"]]
    uppercase = [a for a in analyzed if "wielkie_litery" in a["issues"]]
    underscores = [a for a in analyzed if "podkreslenia" in a["issues"]]
    query_params = [a for a in analyzed if "parametry_query" in a["issues"]]
    too_deep = [a for a in analyzed if "zbyt_glebokie" in a["issues"]]

    # Depth distribution
    depth_dist: Dict[int, int] = {}
    for a in analyzed:
        d = a["depth"]
        depth_dist[d] = depth_dist.get(d, 0) + 1

    # URL length distribution
    avg_url_length = int(sum(a["length"] for a in analyzed) / len(analyzed)) if analyzed else 0

    # Issues summary
    issues_count = {
        "too_long": len(too_long),
        "non_ascii": len(non_ascii),
        "uppercase": len(uppercase),
        "underscores": len(underscores),
        "query_params": len(query_params),
        "too_deep": len(too_deep),
    }
    total_with_issues = len([a for a in analyzed if a["issues"]])

    return {
        "url_struct": {
            "total": len(indexable),
            "total_with_issues": total_with_issues,
            "avg_url_length": avg_url_length,
            "issues_count": issues_count,
            "depth_dist": dict(sorted(depth_dist.items())),
            "too_long": [{"url": a["url"], "length": a["length"]} for a in too_long[:20]],
            "non_ascii": [{"url": a["url"]} for a in non_ascii[:20]],
            "uppercase": [{"url": a["url"]} for a in uppercase[:20]],
            "underscores": [{"url": a["url"]} for a in underscores[:20]],
            "query_params": [{"url": a["url"]} for a in query_params[:20]],
            "too_deep": [{"url": a["url"], "depth": a["depth"]} for a in too_deep[:20]],
        }
    }
