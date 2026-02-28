"""Data extractor for Structured Data (Schema.org) section."""

from typing import Any, Dict
from ..utils import safe_int


def extract(audit_data: Dict[str, Any]) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    crawl = results.get("crawl") or {}
    sd_raw = crawl.get("structured_data") or {}

    return {
        "sd": {
            "found": bool(sd_raw.get("found")),
            "count": safe_int(sd_raw.get("count")),
            "types": sd_raw.get("types") or [],
            "schemas": sd_raw.get("schemas") or [],
            "has_issues": bool(sd_raw.get("has_issues")),
            "missing_suggestions": sd_raw.get("missing_suggestions") or [],
        }
    }
