"""Data extractor for Internal Links section."""

from typing import Any, Dict, List
from ..utils import safe_int, safe_get


def _analyze_link_structure(all_pages: List[Dict]) -> Dict:
    """Analyze internal linking structure for orphan pages and depth issues."""
    indexable = [p for p in all_pages if p.get("status_code") == 200]
    if not indexable:
        return {}

    total = len(indexable)

    # Orphan pages (very few inlinks)
    orphan_pages = [
        {"url": p.get("url", ""), "title": (p.get("title") or "")[:50], "inlinks": safe_int(p.get("inlinks"))}
        for p in indexable
        if safe_int(p.get("inlinks")) <= 1
    ]
    orphan_pages.sort(key=lambda x: x["inlinks"])

    # High outlink pages (potential link equity leaking)
    high_outlinks = [
        {
            "url": p.get("url", ""),
            "title": (p.get("title") or "")[:40],
            "outlinks": safe_int(p.get("outlinks")),
            "external_outlinks": safe_int(p.get("external_outlinks")),
        }
        for p in indexable
        if safe_int(p.get("outlinks")) > 100
    ]
    high_outlinks.sort(key=lambda x: -x["outlinks"])

    # Pages with internal redirects
    redirect_pages = [
        {
            "url": p.get("url", ""),
            "status": p.get("status_code"),
            "redirect_url": (p.get("redirect_url") or "")[:80],
            "inlinks": safe_int(p.get("inlinks")),
        }
        for p in all_pages
        if p.get("status_code") in (301, 302, 307, 308)
    ]
    redirect_pages.sort(key=lambda x: -x["inlinks"])

    # Inlinks distribution
    inlinks_buckets = {"0": 0, "1": 0, "2-5": 0, "6-20": 0, "21+": 0}
    for p in indexable:
        n = safe_int(p.get("inlinks"))
        if n == 0:
            inlinks_buckets["0"] += 1
        elif n == 1:
            inlinks_buckets["1"] += 1
        elif n <= 5:
            inlinks_buckets["2-5"] += 1
        elif n <= 20:
            inlinks_buckets["6-20"] += 1
        else:
            inlinks_buckets["21+"] += 1

    # Top pages by inlinks (most linked = highest authority)
    top_linked = sorted(indexable, key=lambda x: -safe_int(x.get("inlinks")))[:10]
    top_pages = [
        {"url": p.get("url", ""), "title": (p.get("title") or "")[:40], "inlinks": safe_int(p.get("inlinks"))}
        for p in top_linked
    ]

    return {
        "orphan_pages": orphan_pages[:30],
        "orphan_count": len(orphan_pages),
        "high_outlinks": high_outlinks[:10],
        "redirect_pages": redirect_pages[:20],
        "inlinks_buckets": inlinks_buckets,
        "top_linked_pages": top_pages,
        "total_indexable": total,
    }


def extract(audit_data: Dict[str, Any], max_rows: int = 50) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    crawl = results.get("crawl") or {}
    link_data = crawl.get("links") or {}
    ai_contexts = results.get("ai_contexts") or {}
    links_ai = ai_contexts.get("links") or {}
    all_pages = crawl.get("all_pages") or []

    broken_count = safe_int(link_data.get("broken"))
    link_analysis = _analyze_link_structure(all_pages)

    # Problem pages: broken + redirect
    problem_pages = [p for p in all_pages if p.get("status_code") not in (200, None)]
    problem_pages.sort(key=lambda x: (x.get("status_code", 999), -safe_int(x.get("inlinks"))))

    return {
        "links": {
            "internal_count": safe_int(link_data.get("internal")),
            "external_count": safe_int(link_data.get("external")),
            "broken_count": broken_count,
            "redirect_count": safe_int(link_data.get("redirects")),
            "ai_findings": links_ai.get("key_findings") or [],
            "ai_recommendations": links_ai.get("recommendations") or [],
            "pages_sample": problem_pages[:max_rows],
            # Enriched data
            **link_analysis,
        }
    }
