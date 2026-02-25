"""Data extractor for Internal Links section."""

from typing import Any, Dict
from ..utils import safe_int, safe_get


def extract(audit_data: Dict[str, Any], max_rows: int = 50) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    crawl = results.get("crawl") or {}
    links = crawl.get("links") or {}
    ai_contexts = results.get("ai_contexts") or {}
    links_ai = ai_contexts.get("links") or {}
    all_pages = crawl.get("all_pages") or []

    broken_count = safe_int(links.get("broken"))
    # Pages with broken or redirect issues
    problem_pages = [p for p in all_pages if p.get("status_code") in (404, 410, 301, 302, 307, 308)]
    # Sort by status
    problem_pages.sort(key=lambda x: (x.get("status_code", 999), -safe_int(x.get("inlinks"))))

    return {
        "links": {
            "internal_count": safe_int(links.get("internal")),
            "external_count": safe_int(links.get("external")),
            "broken_count": broken_count,
            "redirect_count": safe_int(links.get("redirects")),
            "ai_findings": links_ai.get("key_findings") or [],
            "ai_recommendations": links_ai.get("recommendations") or [],
            "pages_sample": problem_pages[:max_rows],
        }
    }
