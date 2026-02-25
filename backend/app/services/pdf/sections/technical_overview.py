"""Data extractor for Technical Overview section."""

from typing import Any, Dict
from ..utils import safe_get, safe_int


def extract(audit_data: Dict[str, Any]) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    crawl = results.get("crawl") or {}
    security = results.get("security") or {}
    tech_seo = crawl.get("technical_seo") or {}
    links = crawl.get("links") or {}
    pages_by_status = crawl.get("pages_by_status") or {}

    return {
        "tech": {
            "pages_crawled": safe_int(crawl.get("pages_crawled")),
            "pages_200": safe_int(pages_by_status.get("200")),
            "broken_links": safe_int(links.get("broken") or tech_seo.get("broken_links")),
            "redirects": safe_int(links.get("redirects") or tech_seo.get("redirects")),
            "missing_canonical": safe_int(tech_seo.get("missing_canonical")),
            "missing_description": safe_int(tech_seo.get("missing_description")),
            "noindex_pages": safe_int(tech_seo.get("noindex_pages")),
            "internal_links": safe_int(links.get("internal")),
            "external_links": safe_int(links.get("external")),
            "is_https": bool(security.get("is_https")) or crawl.get("url", "").startswith("https"),
            "has_sitemap": bool(crawl.get("has_sitemap")),
            "sitemap_url": crawl.get("sitemap_url") or "",
            "sitemaps": crawl.get("sitemaps") or [],
            "has_robots": True,  # Assume present if crawl succeeded
            "crawl_blocked": bool(crawl.get("crawl_blocked")),
        }
    }
