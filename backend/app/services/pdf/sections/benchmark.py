"""Data extractor for Benchmark section."""

from typing import Any, Dict
from ..utils import safe_float, safe_int


# Industry averages (Lighthouse industry medians, approx)
INDUSTRY_AVG = {
    "performance": 50,
    "accessibility": 80,
    "seo": 79,
    "best_practices": 78,
}


def extract(audit_data: Dict[str, Any]) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    benchmarks = results.get("benchmarks") or {}
    lh_desktop = (results.get("lighthouse") or {}).get("desktop") or {}

    perf_score = safe_float(lh_desktop.get("performance_score") or audit_data.get("performance_score"))
    acc_score = safe_float(lh_desktop.get("accessibility_score"))
    seo_score = safe_float(lh_desktop.get("seo_score") or audit_data.get("seo_score"))
    bp_score = safe_float(lh_desktop.get("best_practices_score"))

    # Build comparison rows
    comparison_rows = [
        {
            "label": "Performance",
            "yours": safe_int(perf_score),
            "avg": INDUSTRY_AVG["performance"],
        },
        {
            "label": "Accessibility",
            "yours": safe_int(acc_score),
            "avg": INDUSTRY_AVG["accessibility"],
        },
        {
            "label": "SEO (Lighthouse)",
            "yours": safe_int(seo_score),
            "avg": INDUSTRY_AVG["seo"],
        },
        {
            "label": "Best Practices",
            "yours": safe_int(bp_score),
            "avg": INDUSTRY_AVG["best_practices"],
        },
    ]

    # Percentile estimation (average of your scores vs avg)
    scores = [perf_score, acc_score, seo_score, bp_score]
    avgs = [INDUSTRY_AVG["performance"], INDUSTRY_AVG["accessibility"], INDUSTRY_AVG["seo"], INDUSTRY_AVG["best_practices"]]
    valid = [(s, a) for s, a in zip(scores, avgs) if s and s > 0]
    if valid:
        ratio = sum(s / a for s, a in valid) / len(valid)
        percentile = min(99, max(1, int(ratio * 50)))  # rough estimate
    else:
        percentile = None

    insights = benchmarks.get("insights") or benchmarks.get("summary") or ""

    return {
        "bench": {
            "performance_score": perf_score,
            "accessibility_score": acc_score,
            "seo_score": seo_score,
            "best_practices_score": bp_score,
            "industry_avg": INDUSTRY_AVG,
            "comparison_rows": comparison_rows,
            "percentile": percentile,
            "insights": insights,
        }
    }
