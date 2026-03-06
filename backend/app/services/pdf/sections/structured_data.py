"""Data extractor for Structured Data (Schema.org) section."""

from typing import Any, Dict
from ..utils import safe_int


def extract(audit_data: Dict[str, Any]) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    crawl = results.get("crawl") or {}
    sd_raw = crawl.get("structured_data") or {}
    sd_v2_raw = crawl.get("structured_data_v2") or {}

    return {
        "sd": {
            "found": bool(sd_raw.get("found")),
            "count": safe_int(sd_raw.get("count")),
            "types": sd_raw.get("types") or [],
            "schemas": sd_raw.get("schemas") or [],
            "has_issues": bool(sd_raw.get("has_issues")),
            "missing_suggestions": sd_raw.get("missing_suggestions") or [],
            "v2_found": bool(sd_v2_raw.get("found")),
            "v2_total_items": safe_int(sd_v2_raw.get("total_items")),
            "v2_types": sd_v2_raw.get("types") or [],
            "v2_items": sd_v2_raw.get("items") or [],
            "v2_issues": sd_v2_raw.get("issues") or [],
            "v2_missing_priority_types": sd_v2_raw.get("missing_priority_types") or [],
            "v2_readiness": sd_v2_raw.get("ai_crawler_readiness") or {},
        }
    }
