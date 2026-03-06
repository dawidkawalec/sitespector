"""Data extractor for Benchmark section."""

from typing import Any, Dict
from ..utils import safe_float, safe_int


# Baseline fallback used only when no external benchmark payload is available.
BASELINE_ESTIMATE = {
    "performance": 50,
    "accessibility": 80,
    "seo": 79,
    "best_practices": 78,
}


def extract(audit_data: Dict[str, Any]) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    benchmarks = results.get("benchmarks") or {}
    lh_desktop = (results.get("lighthouse") or {}).get("desktop") or {}
    benchmark_industry_avg = benchmarks.get("industry_avg") or {}
    benchmark_source = str(benchmarks.get("source") or "").strip()

    perf_score = safe_float(lh_desktop.get("performance_score") or audit_data.get("performance_score"))
    acc_score = safe_float(lh_desktop.get("accessibility_score"))
    seo_score = safe_float(lh_desktop.get("seo_score") or audit_data.get("seo_score"))
    bp_score = safe_float(lh_desktop.get("best_practices_score"))

    if benchmark_industry_avg:
        industry_avg = {
            "performance": safe_int(benchmark_industry_avg.get("performance")),
            "accessibility": safe_int(benchmark_industry_avg.get("accessibility")),
            "seo": safe_int(benchmark_industry_avg.get("seo")),
            "best_practices": safe_int(benchmark_industry_avg.get("best_practices")),
        }
        mode = "dynamic"
        mode_description = benchmark_source or "Porownanie na podstawie zewnetrznego payloadu benchmark."
    else:
        industry_avg = BASELINE_ESTIMATE
        mode = "estimated_baseline"
        mode_description = "Brak dedykowanego benchmarku branzowego - zastosowano jawny baseline estymacyjny."

    # Build comparison rows
    comparison_rows = [
        {
            "label": "Performance",
            "yours": safe_int(perf_score),
            "avg": industry_avg["performance"],
        },
        {
            "label": "Accessibility",
            "yours": safe_int(acc_score),
            "avg": industry_avg["accessibility"],
        },
        {
            "label": "SEO (Lighthouse)",
            "yours": safe_int(seo_score),
            "avg": industry_avg["seo"],
        },
        {
            "label": "Best Practices",
            "yours": safe_int(bp_score),
            "avg": industry_avg["best_practices"],
        },
    ]

    # Relative index: 100 means parity with baseline.
    scores = [perf_score, acc_score, seo_score, bp_score]
    avgs = [industry_avg["performance"], industry_avg["accessibility"], industry_avg["seo"], industry_avg["best_practices"]]
    valid = [(s, a) for s, a in zip(scores, avgs) if s and s > 0]
    if valid:
        ratio = sum(s / a for s, a in valid) / len(valid)
        relative_index = round(ratio * 100, 1)
    else:
        relative_index = None

    insights = benchmarks.get("insights") or benchmarks.get("summary") or ""

    return {
        "bench": {
            "performance_score": perf_score,
            "accessibility_score": acc_score,
            "seo_score": seo_score,
            "best_practices_score": bp_score,
            "industry_avg": industry_avg,
            "comparison_rows": comparison_rows,
            "mode": mode,
            "mode_description": mode_description,
            "relative_index": relative_index,
            "insights": insights,
        }
    }
