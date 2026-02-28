"""Data extractor for Technical Overview section."""

from typing import Any, Dict, List
from ..utils import safe_get, safe_int


def _get_problem_pages(all_pages: List[Dict]) -> Dict[str, List[Dict]]:
    """Categorize pages by problem type."""
    pages_404 = []
    pages_redirect = []
    pages_noindex = []
    pages_no_canonical = []
    pages_no_description = []

    for p in all_pages:
        url = p.get("url", "")
        status = p.get("status_code")
        if status in (404, 410):
            pages_404.append({"url": url, "status": status})
        elif status in (301, 302, 307, 308):
            pages_redirect.append({
                "url": url,
                "status": status,
                "redirect_url": p.get("redirect_url", ""),
                "redirect_type": p.get("redirect_type", ""),
            })
        if p.get("indexability_status") == "Non-Indexable" or "noindex" in (p.get("meta_robots") or "").lower():
            pages_noindex.append({"url": url})
        if not p.get("canonical") and status == 200:
            pages_no_canonical.append({"url": url, "title": p.get("title", "")})
        if not p.get("meta_description") and status == 200:
            pages_no_description.append({"url": url, "title": p.get("title", "")})

    return {
        "pages_404": pages_404[:30],
        "pages_redirect": pages_redirect[:30],
        "pages_noindex": pages_noindex[:20],
        "pages_no_canonical": pages_no_canonical[:20],
        "pages_no_description": pages_no_description[:20],
    }


def _analyze_crawl_depth(all_pages: List[Dict]) -> Dict:
    """Analyze crawl depth distribution."""
    depth_dist = {}
    for p in all_pages:
        url = p.get("url", "")
        # Count depth by slashes after domain
        try:
            path = url.split("//", 1)[-1].split("/", 1)[-1].rstrip("/")
            depth = len([x for x in path.split("/") if x]) if path else 0
        except Exception:
            depth = 0
        depth_dist[depth] = depth_dist.get(depth, 0) + 1

    return depth_dist


def extract(audit_data: Dict[str, Any]) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    crawl = results.get("crawl") or {}
    security = results.get("security") or {}
    tech_seo = crawl.get("technical_seo") or {}
    links = crawl.get("links") or {}
    pages_by_status = crawl.get("pages_by_status") or {}
    all_pages = crawl.get("all_pages") or []

    # Homepage data
    homepage_title = crawl.get("title", "")
    homepage_title_len = crawl.get("title_length") or (len(homepage_title) if homepage_title else 0)
    homepage_desc = crawl.get("meta_description", "")
    homepage_desc_len = crawl.get("meta_description_length") or (len(homepage_desc) if homepage_desc else 0)
    homepage_h1s = crawl.get("h1_tags") or []
    homepage_load_time = crawl.get("load_time")
    homepage_size = crawl.get("size_bytes")

    problem_pages = _get_problem_pages(all_pages)
    depth_dist = _analyze_crawl_depth(all_pages)

    broken_count = safe_int(links.get("broken") or tech_seo.get("broken_links"))
    redirect_count = safe_int(links.get("redirects") or tech_seo.get("redirects"))
    missing_canonical = safe_int(tech_seo.get("missing_canonical"))
    missing_description = safe_int(tech_seo.get("missing_description") or tech_seo.get("missing_descriptions"))
    noindex_count = safe_int(tech_seo.get("noindex_pages"))

    # Domain config
    audit_url = audit_data.get("url", "")
    is_https = bool(security.get("is_https")) or audit_url.startswith("https")

    return {
        "tech": {
            "pages_crawled": safe_int(crawl.get("pages_crawled")),
            "pages_200": safe_int(pages_by_status.get("200")),
            "pages_301": safe_int(pages_by_status.get("301")),
            "pages_302": safe_int(pages_by_status.get("302")),
            "pages_404": safe_int(pages_by_status.get("404")),
            "pages_other": safe_int(pages_by_status.get("other")),
            "broken_links": broken_count,
            "redirects": redirect_count,
            "missing_canonical": missing_canonical,
            "missing_description": missing_description,
            "noindex_pages": noindex_count,
            "internal_links": safe_int(links.get("internal")),
            "external_links": safe_int(links.get("external")),
            "is_https": is_https,
            "has_sitemap": bool(crawl.get("has_sitemap")),
            "sitemap_url": crawl.get("sitemap_url") or "",
            "sitemaps": crawl.get("sitemaps") or [],
            "has_robots": True,
            "crawl_blocked": bool(crawl.get("crawl_blocked")),
            "crawl_blocked_status": crawl.get("crawl_blocked_status"),
            # Homepage analysis
            "homepage_title": homepage_title,
            "homepage_title_len": homepage_title_len,
            "homepage_desc": homepage_desc,
            "homepage_desc_len": homepage_desc_len,
            "homepage_h1s": homepage_h1s,
            "homepage_load_time": homepage_load_time,
            "homepage_size_kb": round(safe_int(homepage_size) / 1024, 1) if homepage_size else None,
            # Problem URLs
            "problem_404": problem_pages["pages_404"],
            "problem_redirects": problem_pages["pages_redirect"],
            "problem_noindex": problem_pages["pages_noindex"],
            "problem_no_canonical": problem_pages["pages_no_canonical"],
            "problem_no_description": problem_pages["pages_no_description"],
            # Depth analysis
            "depth_distribution": depth_dist,
            "max_crawl_depth": max(depth_dist.keys()) if depth_dist else 0,
        }
    }
