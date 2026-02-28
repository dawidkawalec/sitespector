"""Data extractor for Robots.txt & Sitemap section."""

from typing import Any, Dict
from ..utils import safe_int


def extract(audit_data: Dict[str, Any]) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    crawl = results.get("crawl") or {}
    robots_raw = crawl.get("robots_txt") or {}
    sitemap_raw = crawl.get("sitemap_analysis") or {}
    domain_raw = crawl.get("domain_config") or {}

    return {
        "robots": {
            "content": robots_raw.get("content") or "",
            "content_lines": safe_int(robots_raw.get("content_lines")),
            "user_agents": robots_raw.get("user_agents") or [],
            "sitemap_urls": robots_raw.get("sitemap_urls") or [],
            "crawl_delay": robots_raw.get("crawl_delay"),
            "full_block": bool(robots_raw.get("full_block")),
            "blocked_important": robots_raw.get("blocked_important") or [],
            "googlebot_disallow": robots_raw.get("googlebot_disallow") or [],
            "googlebot_allow": robots_raw.get("googlebot_allow") or [],
            "issues": robots_raw.get("issues") or [],
            "has_issues": bool(robots_raw.get("has_issues")),
            "has_data": bool(robots_raw),
        },
        "sitemap_data": {
            "url": sitemap_raw.get("url") or "",
            "total_urls": safe_int(sitemap_raw.get("total_urls")),
            "is_index": bool(sitemap_raw.get("is_index")),
            "child_count": safe_int(sitemap_raw.get("child_count")),
            "child_sitemaps": sitemap_raw.get("child_sitemaps") or [],
            "has_lastmod": bool(sitemap_raw.get("has_lastmod")),
            "stale_entries": safe_int(sitemap_raw.get("stale_entries")),
            "coverage_pct": sitemap_raw.get("coverage_pct"),
            "in_sitemap_not_crawled": sitemap_raw.get("in_sitemap_not_crawled") or [],
            "in_sitemap_not_crawled_count": safe_int(sitemap_raw.get("in_sitemap_not_crawled_count")),
            "crawled_not_in_sitemap": sitemap_raw.get("crawled_not_in_sitemap") or [],
            "crawled_not_in_sitemap_count": safe_int(sitemap_raw.get("crawled_not_in_sitemap_count")),
            "parse_error": sitemap_raw.get("parse_error"),
            "has_data": bool(sitemap_raw and not sitemap_raw.get("parse_error")),
        },
        "domain": {
            "preferred_url": domain_raw.get("preferred_url") or "",
            "is_https": bool(domain_raw.get("is_https")),
            "has_www": bool(domain_raw.get("has_www")),
            "issues": domain_raw.get("issues") or [],
            "variants": domain_raw.get("variants") or {},
            "has_data": bool(domain_raw),
        },
    }
