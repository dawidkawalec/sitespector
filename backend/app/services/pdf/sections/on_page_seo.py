"""Data extractor for On-Page SEO section."""

from typing import Any, Dict, List
from ..utils import safe_int, safe_float, safe_get


def _analyze_pages(all_pages: List[Dict]) -> Dict:
    """Compute on-page SEO stats and categorized problem pages from pages list."""
    indexable = [p for p in all_pages if p.get("status_code") == 200]
    total = len(all_pages)
    total_indexable = len(indexable)

    if total == 0:
        return {}

    # --- Title analysis ---
    missing_titles = [p for p in indexable if not p.get("title")]
    duplicate_title_map = {}
    for p in indexable:
        t = p.get("title", "")
        if t:
            duplicate_title_map.setdefault(t, []).append(p)
    dup_title_groups = [pages for pages in duplicate_title_map.values() if len(pages) > 1]
    short_titles = [p for p in indexable if p.get("title") and len(p.get("title", "")) < 30]
    long_titles = [p for p in indexable if p.get("title") and len(p.get("title", "")) > 60]

    # --- Meta description analysis ---
    missing_descs = [p for p in indexable if not p.get("meta_description")]
    duplicate_desc_map = {}
    for p in indexable:
        d = p.get("meta_description", "")
        if d:
            duplicate_desc_map.setdefault(d, []).append(p)
    dup_desc_groups = [pages for pages in duplicate_desc_map.values() if len(pages) > 1]
    short_descs = [p for p in indexable if p.get("meta_description") and len(p.get("meta_description", "")) < 70]
    long_descs = [p for p in indexable if p.get("meta_description") and len(p.get("meta_description", "")) > 160]

    # --- H1 analysis ---
    missing_h1 = [p for p in indexable if not p.get("h1")]
    duplicate_h1_map = {}
    for p in indexable:
        h = p.get("h1", "")
        if h:
            duplicate_h1_map.setdefault(h, []).append(p)
    dup_h1_groups = [pages for pages in duplicate_h1_map.values() if len(pages) > 1]
    # H1 = Title duplicates
    h1_equals_title = [
        p for p in indexable
        if p.get("h1") and p.get("title") and p["h1"].strip().lower() == p["title"].strip().lower()
    ]

    # --- H2 ---
    has_h2 = sum(1 for p in indexable if p.get("h2"))

    # --- Content quality ---
    thin_content = [p for p in indexable if safe_int(p.get("word_count")) < 300]
    word_counts = [safe_int(p.get("word_count")) for p in indexable if p.get("word_count")]
    avg_words = int(sum(word_counts) / len(word_counts)) if word_counts else 0
    flesch_scores = [safe_float(p.get("flesch_reading_ease")) for p in indexable if p.get("flesch_reading_ease")]
    avg_flesch = round(sum(flesch_scores) / len(flesch_scores), 1) if flesch_scores else None

    # --- Build problem page samples ---
    def page_sample(pages, limit=20):
        return [
            {
                "url": p.get("url", ""),
                "title": (p.get("title") or "")[:60],
                "meta_description": (p.get("meta_description") or "")[:80],
                "h1": (p.get("h1") or "")[:60],
                "word_count": safe_int(p.get("word_count")),
                "status_code": p.get("status_code"),
                "title_len": len(p.get("title") or ""),
                "desc_len": len(p.get("meta_description") or ""),
            }
            for p in pages[:limit]
        ]

    # Duplicate title examples (flatten groups)
    dup_title_examples = []
    for group in dup_title_groups[:10]:
        for p in group[:3]:
            dup_title_examples.append({
                "url": p.get("url", ""),
                "title": (p.get("title") or "")[:70],
            })

    dup_h1_examples = []
    for group in dup_h1_groups[:10]:
        for p in group[:3]:
            dup_h1_examples.append({
                "url": p.get("url", ""),
                "h1": (p.get("h1") or "")[:70],
            })

    return {
        "total": total,
        "total_indexable": total_indexable,
        # Title stats
        "has_title_count": total_indexable - len(missing_titles),
        "missing_titles_count": len(missing_titles),
        "missing_title_pages": page_sample(missing_titles, 15),
        "duplicate_title_groups": len(dup_title_groups),
        "dup_title_examples": dup_title_examples[:20],
        "short_titles": len(short_titles),
        "long_titles": len(long_titles),
        "long_title_pages": page_sample(long_titles, 10),
        # Meta description stats
        "has_desc_count": total_indexable - len(missing_descs),
        "missing_descriptions": len(missing_descs),
        "missing_desc_pages": page_sample(missing_descs, 15),
        "duplicate_descriptions": len(dup_desc_groups),
        "short_descriptions": len(short_descs),
        "long_descriptions": len(long_descs),
        # H1 stats
        "has_h1_count": total_indexable - len(missing_h1),
        "missing_h1": len(missing_h1),
        "missing_h1_pages": page_sample(missing_h1, 15),
        "duplicate_h1_groups": len(dup_h1_groups),
        "dup_h1_examples": dup_h1_examples[:20],
        "h1_equals_title_count": len(h1_equals_title),
        "has_h2_count": has_h2,
        # Content stats
        "thin_content_count": len(thin_content),
        "thin_content_pages": page_sample(thin_content, 20),
        "avg_word_count": avg_words,
        "avg_flesch": avg_flesch,
    }


def extract(audit_data: Dict[str, Any], max_rows: int = 50, extended: bool = False) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    crawl = results.get("crawl") or {}
    content_deep = results.get("content_deep") or {}
    images_data = crawl.get("images") or {}
    all_pages = crawl.get("all_pages") or []
    sf_tabs = crawl.get("sf_raw_tabs") or {}

    stats = _analyze_pages(all_pages)

    # Images without ALT
    all_images = images_data.get("all_images") or []
    images_no_alt = [
        {"url": img.get("url", ""), "size_kb": round(safe_int(img.get("size_bytes")) / 1024, 1) if img.get("size_bytes") else 0}
        for img in all_images
        if not img.get("alt_text")
    ]

    return {
        "onpage": {
            **stats,
            "duplicate_content_count": safe_int(content_deep.get("duplicate_content_count")),
            "total_images": safe_int(images_data.get("total") or crawl.get("total_images")),
            "images_without_alt": safe_int(images_data.get("without_alt") or crawl.get("images_without_alt")),
            "images_no_alt_sample": images_no_alt[:30],
            "sf_tabs_data": sf_tabs if extended else None,
        },
        "extended": extended,
    }
