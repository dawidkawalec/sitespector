"""
Page type classifier for crawled URLs.

Classifies pages into types (homepage, product, category, blog, service, contact, about, other)
using URL patterns, content signals, and structured data hints.
"""

import re
import logging
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

# Page types
PAGE_TYPES = [
    "homepage",
    "product",
    "category",
    "blog",
    "service",
    "contact",
    "about",
    "other",
]

# Layer 1: URL pattern matching (ordered by specificity)
URL_PATTERNS: Dict[str, List[str]] = {
    "product": [
        r"/produkt[/\-]",
        r"/product[/\-]",
        r"/products/[^/]+$",
        r"/produkty/[^/]+$",
        r"/p/[^/]+",
        r"/sku/",
        r"/towar/",
        r"/sklep/[^/]+/[^/]+",  # /sklep/category/product
        r"/shop/[^/]+/[^/]+",
        r"/item/",
        r"/offer/[^/]+$",
        r"/oferta/[^/]+/[^/]+$",
    ],
    "category": [
        r"/kategoria[/\-]",
        r"/category[/\-]",
        r"/categories/",
        r"/kategorie/",
        r"/kolekcja[/\-]",
        r"/collection[s]?/",
        r"/c/[^/]+$",
        r"/sklep/[^/]+/?$",  # /sklep/category (no deeper)
        r"/shop/[^/]+/?$",
        r"/produkty/?$",
        r"/products/?$",
    ],
    "blog": [
        r"/blog[/\-]",
        r"/artykul[/\-]",
        r"/artykuly[/\-]",
        r"/article[s]?/",
        r"/news[/\-]",
        r"/aktualnosci[/\-]",
        r"/wpis[/\-]",
        r"/wpisy[/\-]",
        r"/poradnik[/\-]",
        r"/poradniki[/\-]",
        r"/wiedza[/\-]",
        r"/baza-wiedzy[/\-]",
        r"/tips[/\-]",
        r"/guide[s]?/",
    ],
    "service": [
        r"/uslugi[/\-]",
        r"/usluga[/\-]",
        r"/services?[/\-]",
        r"/oferta/?$",
        r"/co-robimy[/\-]",
        r"/what-we-do[/\-]",
    ],
    "contact": [
        r"/kontakt",
        r"/contact",
        r"/napisz-do-nas",
        r"/skontaktuj-sie",
    ],
    "about": [
        r"/o-nas",
        r"/about",
        r"/firma/?$",
        r"/company/?$",
        r"/zespol/?$",
        r"/team/?$",
        r"/kim-jestesmy",
        r"/who-we-are",
    ],
}

# Compiled patterns cache
_COMPILED_PATTERNS: Optional[Dict[str, List[re.Pattern]]] = None


def _get_compiled_patterns() -> Dict[str, List[re.Pattern]]:
    global _COMPILED_PATTERNS
    if _COMPILED_PATTERNS is None:
        _COMPILED_PATTERNS = {
            ptype: [re.compile(p, re.IGNORECASE) for p in patterns]
            for ptype, patterns in URL_PATTERNS.items()
        }
    return _COMPILED_PATTERNS


def _classify_by_url(url: str, site_root: str) -> Optional[str]:
    """Layer 1: Classify page by URL pattern matching."""
    parsed = urlparse(url)
    path = parsed.path.rstrip("/")

    # Homepage detection
    root_parsed = urlparse(site_root)
    root_path = root_parsed.path.rstrip("/")
    if path == root_path or path == "" or path == "/":
        return "homepage"

    compiled = _get_compiled_patterns()
    for ptype, patterns in compiled.items():
        for pattern in patterns:
            if pattern.search(path):
                return ptype

    return None


def _classify_by_content(page: Dict[str, Any], structured_data_types: List[str]) -> Optional[str]:
    """
    Layer 2: Classify by content signals when URL matching fails.
    Uses word count, structured data, title/h1 patterns.
    """
    word_count = page.get("word_count", 0) or 0
    title = (page.get("title") or "").lower()
    h1 = (page.get("h1") or "").lower()
    url = (page.get("url") or "").lower()

    # Structured data hints
    sd_types_lower = [t.lower() for t in structured_data_types]
    if any(t in sd_types_lower for t in ["product", "offer"]):
        return "product"
    if any(t in sd_types_lower for t in ["article", "blogposting", "newsarticle"]):
        return "blog"
    if any(t in sd_types_lower for t in ["service"]):
        return "service"
    if any(t in sd_types_lower for t in ["contactpage"]):
        return "contact"
    if any(t in sd_types_lower for t in ["aboutpage"]):
        return "about"

    # Title/H1 hints for Polish sites
    contact_keywords = ["kontakt", "contact", "napisz do nas", "skontaktuj"]
    if any(kw in title or kw in h1 for kw in contact_keywords):
        return "contact"

    about_keywords = ["o nas", "o firmie", "about us", "kim jestesmy", "zespol", "team"]
    if any(kw in title or kw in h1 for kw in about_keywords):
        return "about"

    # Blog heuristic: high word count + deep URL
    depth = page.get("crawl_depth", 0) or 0
    if word_count > 800 and depth >= 2:
        # Might be blog/article — check if URL doesn't look like product
        if not any(seg in url for seg in ["/produkt", "/product", "/sklep", "/shop"]):
            return "blog"

    return None


def classify_pages(
    all_pages: List[Dict[str, Any]],
    site_url: str,
    structured_data_v2: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Classify all crawled pages by type.

    Returns:
        {
            "classifications": {url: page_type, ...},
            "page_type_stats": {type: count, ...},
            "sample_urls_by_type": {type: [url1, url2, url3], ...}
        }
    """
    classifications: Dict[str, str] = {}
    stats: Dict[str, int] = {pt: 0 for pt in PAGE_TYPES}
    samples: Dict[str, List[str]] = {pt: [] for pt in PAGE_TYPES}

    # Extract structured data types per URL if available
    sd_types_by_url: Dict[str, List[str]] = {}
    if structured_data_v2 and structured_data_v2.get("found"):
        for item in structured_data_v2.get("items", []):
            item_type = item.get("type", "")
            # structured_data_v2 is homepage-only, so map to site root
            root = urlparse(site_url).scheme + "://" + urlparse(site_url).netloc
            sd_types_by_url.setdefault(root, []).append(item_type)
            sd_types_by_url.setdefault(root + "/", []).append(item_type)

    site_root = site_url.rstrip("/")

    for page in all_pages:
        url = page.get("url", "")
        if not url:
            continue

        # Layer 1: URL pattern
        page_type = _classify_by_url(url, site_root)

        # Layer 2: Content signals (if URL didn't match)
        if page_type is None:
            sd_types = sd_types_by_url.get(url.rstrip("/"), [])
            page_type = _classify_by_content(page, sd_types)

        # Fallback
        if page_type is None:
            page_type = "other"

        classifications[url] = page_type
        stats[page_type] = stats.get(page_type, 0) + 1
        if len(samples.get(page_type, [])) < 5:
            samples.setdefault(page_type, []).append(url)

    # Remove empty types from stats
    stats = {k: v for k, v in stats.items() if v > 0}

    total = len(all_pages)
    logger.info(
        "Page classification complete: %d pages, types: %s",
        total,
        ", ".join(f"{k}={v}" for k, v in sorted(stats.items(), key=lambda x: -x[1])),
    )

    return {
        "classifications": classifications,
        "page_type_stats": stats,
        "sample_urls_by_type": samples,
    }


def select_representative_pages(
    all_pages: List[Dict[str, Any]],
    classifications: Dict[str, str],
    max_per_type: int = 2,
    max_total: int = 10,
) -> List[str]:
    """
    Select representative page URLs for multi-page Lighthouse.
    Picks pages with highest inlinks per type (most important pages).
    Excludes homepage (already audited separately).
    """
    # Group pages by type, sorted by inlinks desc
    by_type: Dict[str, List[Dict[str, Any]]] = {}
    for page in all_pages:
        url = page.get("url", "")
        ptype = classifications.get(url, "other")
        if ptype == "homepage":
            continue
        by_type.setdefault(ptype, []).append(page)

    for ptype in by_type:
        by_type[ptype].sort(key=lambda p: p.get("inlinks", 0) or 0, reverse=True)

    selected: List[str] = []
    # Round-robin: pick 1 from each type, then 2nd, etc.
    for round_idx in range(max_per_type):
        for ptype in ["product", "category", "service", "blog", "other", "contact", "about"]:
            if len(selected) >= max_total:
                break
            pages = by_type.get(ptype, [])
            if round_idx < len(pages):
                selected.append(pages[round_idx]["url"])

    return selected
