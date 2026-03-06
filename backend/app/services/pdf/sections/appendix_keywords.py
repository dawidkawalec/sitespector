"""Data extractor for Appendix - Keywords."""

from typing import Any, Dict
from ..utils import as_list, safe_float, safe_get, safe_int


def extract(audit_data: Dict[str, Any], max_rows: int = 200) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    senuto = results.get("senuto") or {}
    vis = senuto.get("visibility") or {}
    positions = as_list(vis.get("positions"))

    normalized_keywords = []
    for row in positions:
        keyword = row.get("keyword") or row.get("phrase") or ""
        position = safe_int(
            row.get("position")
            or safe_get(row, "statistics", "position", "current")
            or safe_get(row, "statistics", "position", "recent_value")
            or 999
        )
        search_volume = safe_int(
            row.get("search_volume")
            or safe_get(row, "statistics", "searches", "current")
            or safe_get(row, "statistics", "searches", "recent_value")
        )
        intent = (
            row.get("intent")
            or safe_get(row, "statistics", "intent")
            or safe_get(row, "statistics", "intentions", "main_intent")
            or ""
        )
        difficulty = safe_int(
            row.get("difficulty")
            or safe_get(row, "statistics", "difficulty", "current")
            or safe_get(row, "statistics", "difficulty", "recent_value")
        )
        cpc = safe_float(
            row.get("cpc")
            or safe_get(row, "statistics", "cpc", "current")
            or safe_get(row, "statistics", "cpc", "recent_value")
        )
        url = (
            row.get("url")
            or safe_get(row, "statistics", "url", "current")
            or safe_get(row, "statistics", "url", "recent_value")
            or ""
        )

        if not keyword:
            continue

        normalized_keywords.append(
            {
                "keyword": keyword,
                "position": position,
                "search_volume": search_volume,
                "intent": intent,
                "difficulty": difficulty,
                "cpc": cpc,
                "url": url,
            }
        )

    total_count = len(normalized_keywords)
    sorted_kw = sorted(normalized_keywords, key=lambda x: (-(x.get("search_volume") or 0), x.get("position") or 999))
    return {
        "app_kw": {
            "keywords": sorted_kw[:max_rows],
            "total_count": total_count,
        }
    }
