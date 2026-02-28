"""Data extractor for Heading Hierarchy Analysis section."""

from typing import Any, Dict, List
from ..utils import safe_int


def extract(audit_data: Dict[str, Any], extended: bool = False) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    crawl = results.get("crawl") or {}
    all_pages = crawl.get("all_pages") or []

    indexable = [p for p in all_pages if p.get("status_code") == 200]
    total = len(indexable)

    if total == 0:
        return {
            "heading": {
                "total": 0,
                "has_data": False,
            }
        }

    # --- H1 analysis ---
    missing_h1_pages = [
        {"url": p.get("url", ""), "title": (p.get("title") or "")[:60], "word_count": safe_int(p.get("word_count"))}
        for p in indexable if not p.get("h1")
    ]

    # Duplicate H1 detection
    h1_map: Dict[str, List] = {}
    for p in indexable:
        h1 = (p.get("h1") or "").strip().lower()
        if h1:
            h1_map.setdefault(h1, []).append(p)
    dup_h1_groups = [(h1_text, pages) for h1_text, pages in h1_map.items() if len(pages) > 1]
    dup_h1_groups.sort(key=lambda x: -len(x[1]))

    dup_h1_examples = []
    for h1_text, pages in dup_h1_groups[:15]:
        for p in pages[:3]:
            dup_h1_examples.append({
                "h1": (p.get("h1") or "")[:80],
                "url": p.get("url", ""),
                "title": (p.get("title") or "")[:40],
            })

    # H1 = Title duplicates (identical text)
    h1_equals_title = [
        {
            "url": p.get("url", ""),
            "title": (p.get("title") or "")[:60],
            "h1": (p.get("h1") or "")[:60],
        }
        for p in indexable
        if p.get("h1") and p.get("title") and p["h1"].strip().lower() == p["title"].strip().lower()
    ]

    # --- H2 analysis ---
    missing_h2_pages = [
        {"url": p.get("url", ""), "title": (p.get("title") or "")[:50], "word_count": safe_int(p.get("word_count"))}
        for p in indexable
        if not p.get("h2") and safe_int(p.get("word_count")) > 300
    ]

    # H1 contains H2 (H2 same as H1 on same page)
    h1_h2_same = [
        {
            "url": p.get("url", ""),
            "h1": (p.get("h1") or "")[:60],
            "h2": (p.get("h2") or "")[:60],
        }
        for p in indexable
        if p.get("h1") and p.get("h2") and p["h1"].strip().lower() == p["h2"].strip().lower()
    ]

    # Pages with H2 but no H1
    h2_no_h1 = [
        {"url": p.get("url", ""), "h2": (p.get("h2") or "")[:60]}
        for p in indexable
        if p.get("h2") and not p.get("h1")
    ]

    # Summary stats
    has_h1 = total - len(missing_h1_pages)
    has_h2 = sum(1 for p in indexable if p.get("h2"))

    return {
        "heading": {
            "has_data": True,
            "total": total,
            # H1 stats
            "has_h1": has_h1,
            "missing_h1_count": len(missing_h1_pages),
            "missing_h1_pages": missing_h1_pages[:30],
            "dup_h1_count": len(dup_h1_groups),
            "dup_h1_examples": dup_h1_examples[:30],
            "h1_equals_title_count": len(h1_equals_title),
            "h1_equals_title_pages": h1_equals_title[:15],
            # H2 stats
            "has_h2": has_h2,
            "missing_h2_count": len(missing_h2_pages),
            "missing_h2_pages": missing_h2_pages[:20] if extended else missing_h2_pages[:10],
            "h1_h2_same_count": len(h1_h2_same),
            "h1_h2_same_pages": h1_h2_same[:10],
            "h2_no_h1_count": len(h2_no_h1),
            "h2_no_h1_pages": h2_no_h1[:10],
        }
    }
