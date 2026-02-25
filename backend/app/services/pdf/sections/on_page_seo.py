"""Data extractor for On-Page SEO section."""

from typing import Any, Dict, List
from ..utils import safe_int, safe_float, safe_get


def _analyze_pages(all_pages: List[Dict]) -> Dict:
    """Compute on-page SEO stats from pages list."""
    total = len(all_pages)
    if total == 0:
        return {}

    missing_titles = sum(1 for p in all_pages if not p.get("title"))
    missing_descriptions = sum(1 for p in all_pages if not p.get("meta_description"))
    missing_h1 = sum(1 for p in all_pages if not p.get("h1"))
    thin_content = sum(1 for p in all_pages if safe_int(p.get("word_count")) < 200)

    # Title lengths
    titles = [p.get("title", "") or "" for p in all_pages if p.get("title")]
    short_titles = sum(1 for t in titles if len(t) < 30)
    long_titles = sum(1 for t in titles if len(t) > 60)

    # Meta desc lengths
    descs = [p.get("meta_description", "") or "" for p in all_pages if p.get("meta_description")]
    short_descs = sum(1 for d in descs if len(d) < 70)
    long_descs = sum(1 for d in descs if len(d) > 160)

    # Duplicates (by title)
    title_list = [p.get("title") for p in all_pages if p.get("title")]
    dup_titles = len(title_list) - len(set(title_list))
    desc_list = [p.get("meta_description") for p in all_pages if p.get("meta_description")]
    dup_descs = len(desc_list) - len(set(desc_list))

    # Word count average
    word_counts = [safe_int(p.get("word_count")) for p in all_pages if p.get("word_count")]
    avg_words = int(sum(word_counts) / len(word_counts)) if word_counts else 0

    # Flesch average
    flesch_scores = [safe_float(p.get("flesch_reading_ease")) for p in all_pages if p.get("flesch_reading_ease")]
    avg_flesch = sum(flesch_scores) / len(flesch_scores) if flesch_scores else None

    # Multiple H1
    multiple_h1 = 0  # SF doesn't directly expose this in summary

    # H2 presence
    has_h2_count = sum(1 for p in all_pages if p.get("h2"))

    return {
        "total": total,
        "has_title_count": total - missing_titles,
        "missing_titles": missing_titles,
        "has_desc_count": total - missing_descriptions,
        "missing_descriptions": missing_descriptions,
        "has_h1_count": total - missing_h1,
        "missing_h1": missing_h1,
        "multiple_h1": multiple_h1,
        "has_h2_count": has_h2_count,
        "duplicate_titles": dup_titles,
        "duplicate_descriptions": dup_descs,
        "short_titles": short_titles,
        "long_titles": long_titles,
        "short_descriptions": short_descs,
        "long_descriptions": long_descs,
        "thin_content_count": thin_content,
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

    # Pages needing attention (broken + 404 + noindex)
    problem_pages = [p for p in all_pages if p.get("status_code") not in (200, 301, 302)]
    pages_sample = (problem_pages or all_pages[:max_rows])[:max_rows]

    return {
        "onpage": {
            **stats,
            "duplicate_content_count": safe_int(content_deep.get("duplicate_content_count")),
            "total_images": safe_int(images_data.get("total") or crawl.get("total_images")),
            "images_without_alt": safe_int(images_data.get("without_alt") or crawl.get("images_without_alt")),
            "pages_sample": pages_sample,
            "sf_tabs_data": sf_tabs if extended else None,
        },
        "extended": extended,
    }
