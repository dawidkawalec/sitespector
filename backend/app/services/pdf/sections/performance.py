"""Data extractor for Performance section."""

from typing import Any, Dict, List
from ..utils import safe_float, safe_int, fmt_ms, cwv_status


def _build_cwv_rows(lh_data: Dict) -> List[Dict]:
    """Build CWV rows for template."""
    metrics = [
        ("LCP", "lcp", "ms"),
        ("FCP", "fcp", "ms"),
        ("TBT", "total_blocking_time", "ms"),
        ("TTFB", "ttfb", "ms"),
        ("Speed Index", "speed_index", "ms"),
        ("CLS", "cls", ""),
    ]
    rows = []
    for label, key, unit in metrics:
        val = lh_data.get(key)
        if val is None:
            continue
        metric_key = "cls" if key == "cls" else key.replace("total_blocking_time", "tbt").replace("speed_index", "si")
        status_label, status_color = cwv_status(metric_key, safe_float(val))
        if key == "cls":
            value_fmt = f"{safe_float(val):.3f}"
        else:
            value_fmt = fmt_ms(safe_float(val))
        rows.append({
            "label": label,
            "value_fmt": value_fmt,
            "status_label": status_label,
            "status_color": status_color,
        })
    return rows


def extract(audit_data: Dict[str, Any]) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    lh = results.get("lighthouse") or {}
    desktop = lh.get("desktop") or {}
    mobile = lh.get("mobile") or {}
    ai_contexts = results.get("ai_contexts") or {}
    perf_ai = ai_contexts.get("performance") or {}

    desktop_score = safe_float(desktop.get("performance_score") or audit_data.get("performance_score"))
    mobile_score = safe_float(mobile.get("performance_score"))

    # CWV data dicts for chart
    desktop_cwv_dict = {
        "LCP": safe_float(desktop.get("lcp")),
        "FCP": safe_float(desktop.get("fcp")),
        "TBT": safe_float(desktop.get("total_blocking_time")),
        "TTFB": safe_float(desktop.get("ttfb")),
        "SI": safe_float(desktop.get("speed_index")),
    }
    mobile_cwv_dict = {
        "LCP": safe_float(mobile.get("lcp")),
        "FCP": safe_float(mobile.get("fcp")),
        "TBT": safe_float(mobile.get("total_blocking_time")),
        "TTFB": safe_float(mobile.get("ttfb")),
        "SI": safe_float(mobile.get("speed_index")),
    }
    # Remove None values
    desktop_cwv_dict = {k: v for k, v in desktop_cwv_dict.items() if v is not None and v > 0}
    mobile_cwv_dict = {k: v for k, v in mobile_cwv_dict.items() if v is not None and v > 0}

    return {
        "perf": {
            "desktop_score": desktop_score,
            "mobile_score": mobile_score,
            "accessibility_score": safe_float(desktop.get("accessibility_score")),
            "best_practices_score": safe_float(desktop.get("best_practices_score")),
            "desktop_cwv": _build_cwv_rows(desktop),
            "mobile_cwv": _build_cwv_rows(mobile),
            "desktop_cwv_dict": desktop_cwv_dict,
            "mobile_cwv_dict": mobile_cwv_dict,
            "ai_summary": perf_ai.get("summary") or "",
            "ai_key_findings": perf_ai.get("key_findings") or [],
            "ai_recommendations": perf_ai.get("recommendations") or [],
        }
    }
