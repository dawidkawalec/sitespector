"""Data extractor for Redirect Analysis section."""

from typing import Any, Dict, List
from ..utils import safe_int


def extract(audit_data: Dict[str, Any]) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    crawl = results.get("crawl") or {}
    all_pages = crawl.get("all_pages") or []
    links = crawl.get("links") or {}

    # All redirect pages
    redirect_pages = [p for p in all_pages if p.get("status_code") in (301, 302, 307, 308)]
    redirect_301 = [p for p in redirect_pages if p.get("status_code") == 301]
    redirect_302 = [p for p in redirect_pages if p.get("status_code") == 302]
    redirect_307_308 = [p for p in redirect_pages if p.get("status_code") in (307, 308)]

    # Redirects to HTTP (https → http downgrade)
    http_redirects = [
        p for p in redirect_pages
        if (p.get("redirect_url") or "").startswith("http://")
    ]

    # External redirects (redirect to different domain)
    audit_url = audit_data.get("url", "")
    try:
        from urllib.parse import urlparse
        audit_domain = urlparse(audit_url).netloc.replace("www.", "")
    except Exception:
        audit_domain = ""

    external_redirects = []
    if audit_domain:
        for p in redirect_pages:
            rurl = p.get("redirect_url", "")
            if rurl:
                try:
                    from urllib.parse import urlparse
                    rdom = urlparse(rurl).netloc.replace("www.", "")
                    if rdom and rdom != audit_domain:
                        external_redirects.append({
                            "url": p.get("url", ""),
                            "redirect_url": rurl[:80],
                            "status": p.get("status_code"),
                        })
                except Exception:
                    pass

    # High-value redirects (with many inlinks)
    high_value_redirects = sorted(
        redirect_pages,
        key=lambda x: -safe_int(x.get("inlinks"))
    )

    def page_row(p: Dict) -> Dict:
        return {
            "url": p.get("url", ""),
            "status": p.get("status_code"),
            "redirect_url": (p.get("redirect_url") or "")[:80],
            "redirect_type": p.get("redirect_type", ""),
            "inlinks": safe_int(p.get("inlinks")),
        }

    return {
        "redirect": {
            "total_redirects": len(redirect_pages),
            "count_301": len(redirect_301),
            "count_302": len(redirect_302),
            "count_307_308": len(redirect_307_308),
            "http_redirects_count": len(http_redirects),
            "external_redirects_count": len(external_redirects),
            "external_redirects": external_redirects[:20],
            "http_redirects": [page_row(p) for p in http_redirects[:15]],
            "high_value_redirects": [page_row(p) for p in high_value_redirects[:30]],
            "all_redirects": [page_row(p) for p in redirect_pages[:50]],
        }
    }
