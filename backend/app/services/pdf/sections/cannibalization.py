"""Data extractor for Keyword Cannibalization section."""

from typing import Any, Dict, List
from ..utils import safe_int, as_list


def extract(audit_data: Dict[str, Any]) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    senuto = results.get("senuto") or {}
    visibility = senuto.get("visibility") or {}

    # Cannibalization data from Senuto — may be list or dict
    cannibalization_raw = visibility.get("cannibalization")
    if isinstance(cannibalization_raw, list):
        cannibal_keywords = cannibalization_raw
    elif isinstance(cannibalization_raw, dict):
        cannibal_keywords = as_list(cannibalization_raw.get("keywords") or cannibalization_raw.get("data"))
    else:
        cannibal_keywords = []

    # Build cannibalization groups
    cannibal_groups = []
    if cannibal_keywords:
        # Group by keyword if it's a flat list with keyword field
        keyword_map: Dict[str, List] = {}
        for item in cannibal_keywords:
            kw = item.get("keyword") or item.get("phrase") or ""
            if kw:
                keyword_map.setdefault(kw, []).append(item)
        for kw, pages in keyword_map.items():
            if len(pages) > 1:
                cannibal_groups.append({
                    "keyword": kw,
                    "pages": [
                        {
                            "url": p.get("url") or p.get("address") or "",
                            "position": safe_int(p.get("position") or p.get("pos")),
                            "volume": safe_int(p.get("search_volume") or p.get("volume")),
                        }
                        for p in pages
                    ],
                    "volume": safe_int(pages[0].get("search_volume") or pages[0].get("volume")),
                })
        cannibal_groups.sort(key=lambda x: -(x.get("volume") or 0))

    # Also check positions data for multiple URLs per keyword
    positions = as_list(visibility.get("positions"))
    if not cannibal_groups and positions:
        pos_keyword_map: Dict[str, List] = {}
        for p in positions:
            kw = p.get("keyword") or p.get("phrase") or ""
            url = p.get("url") or p.get("address") or ""
            if kw and url:
                pos_keyword_map.setdefault(kw, []).append(p)
        for kw, pages in pos_keyword_map.items():
            # Check unique URLs
            unique_urls = list({p.get("url") or p.get("address") for p in pages})
            if len(unique_urls) > 1:
                cannibal_groups.append({
                    "keyword": kw,
                    "pages": [
                        {
                            "url": p.get("url") or p.get("address") or "",
                            "position": safe_int(p.get("position") or p.get("pos")),
                            "volume": safe_int(p.get("search_volume") or p.get("volume")),
                        }
                        for p in pages
                    ],
                    "volume": safe_int(pages[0].get("search_volume") or pages[0].get("volume")),
                })
        cannibal_groups.sort(key=lambda x: -(x.get("volume") or 0))

    total_keywords_affected = sum(len(g["pages"]) for g in cannibal_groups)
    high_volume_groups = [g for g in cannibal_groups if (g.get("volume") or 0) >= 100]

    return {
        "cannibal": {
            "has_data": bool(cannibal_groups),
            "total_groups": len(cannibal_groups),
            "total_affected_pages": total_keywords_affected,
            "high_volume_groups": len(high_volume_groups),
            "groups": cannibal_groups[:30],
        }
    }
