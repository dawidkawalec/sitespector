"""
Composite scoring services for audit quick-win indicators.
"""

from __future__ import annotations

import math
from typing import Any, Dict, List

CTR_CURVE: Dict[int, float] = {
    1: 0.28,
    2: 0.15,
    3: 0.11,
    4: 0.08,
    5: 0.06,
    6: 0.05,
    7: 0.04,
    8: 0.03,
    9: 0.025,
    10: 0.02,
    11: 0.018,
    12: 0.016,
    13: 0.014,
    14: 0.012,
    15: 0.01,
    16: 0.009,
    17: 0.008,
    18: 0.007,
    19: 0.0065,
    20: 0.006,
}


def _to_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _to_int(value: Any, default: int = 0) -> int:
    try:
        if value is None:
            return default
        return int(float(value))
    except (TypeError, ValueError):
        return default


def _clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, value))


def _scaled_penalty(count: int, factor: float, cap: float) -> float:
    if count <= 0:
        return 0.0
    return min(cap, math.sqrt(count) * factor)


def _avg(values: List[float], fallback: float = 0.0) -> float:
    filtered = [v for v in values if isinstance(v, (int, float))]
    if not filtered:
        return fallback
    return sum(filtered) / len(filtered)


def _status_from_score(score: float) -> str:
    if score >= 80:
        return "good"
    if score >= 60:
        return "moderate"
    return "critical"


def _grade_from_score(score: float) -> str:
    if score >= 90:
        return "A"
    if score >= 80:
        return "B"
    if score >= 70:
        return "C"
    if score >= 60:
        return "D"
    return "F"


def _extract_search_volume(row: Dict[str, Any]) -> int:
    direct_candidates = [
        row.get("search_volume"),
        row.get("searches"),
        row.get("monthly_searches"),
        row.get("volume"),
    ]
    for candidate in direct_candidates:
        parsed = _to_int(candidate, -1)
        if parsed >= 0:
            return parsed

    statistics = row.get("statistics")
    if isinstance(statistics, dict):
        searches_obj = statistics.get("searches")
        if isinstance(searches_obj, dict):
            for key in ("current", "recent_value", "value"):
                parsed = _to_int(searches_obj.get(key), -1)
                if parsed >= 0:
                    return parsed

    return 0


def _extract_keyword(row: Dict[str, Any]) -> str:
    for key in ("keyword", "phrase", "name"):
        value = row.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""


def _extract_position_change(row: Dict[str, Any]) -> float:
    if "position_change" in row:
        return _to_float(row.get("position_change"), 0.0)

    statistics = row.get("statistics")
    if isinstance(statistics, dict):
        position_obj = statistics.get("position")
        if isinstance(position_obj, dict):
            return _to_float(position_obj.get("diff"), 0.0)
    return 0.0


def _extract_position(row: Dict[str, Any]) -> int:
    direct_candidates = [
        row.get("position"),
        row.get("current_position"),
        row.get("best_position"),
    ]
    for candidate in direct_candidates:
        parsed = _to_int(candidate, -1)
        if parsed > 0:
            return parsed

    statistics = row.get("statistics")
    if isinstance(statistics, dict):
        position_obj = statistics.get("position")
        if isinstance(position_obj, dict):
            for key in ("current", "recent_value", "value"):
                parsed = _to_int(position_obj.get(key), -1)
                if parsed > 0:
                    return parsed
    return 0


def _extract_url(row: Dict[str, Any]) -> str:
    direct_candidates = [
        row.get("url"),
        row.get("landing_page"),
        row.get("best_url"),
    ]
    for candidate in direct_candidates:
        if isinstance(candidate, str) and candidate.strip():
            return candidate.strip()

    statistics = row.get("statistics")
    if isinstance(statistics, dict):
        url_obj = statistics.get("url")
        if isinstance(url_obj, dict):
            for key in ("current", "recent_value", "value"):
                candidate = url_obj.get(key)
                if isinstance(candidate, str) and candidate.strip():
                    return candidate.strip()
    return ""


def _ctr_at(position: int) -> float:
    if position <= 0:
        return 0.0
    return CTR_CURVE.get(position, 0.005)


def _cqi_status(score: float) -> str:
    if score >= 85:
        return "excellent"
    if score >= 70:
        return "good"
    if score >= 55:
        return "needs_work"
    return "poor"


def _score_word_count(word_count: int) -> float:
    if word_count <= 0:
        return 10.0
    if word_count < 150:
        return 25.0
    if word_count < 300:
        return 50.0
    if word_count < 800:
        return 60.0 + ((word_count - 300) / 500.0) * 35.0
    if word_count <= 2000:
        return 100.0
    if word_count <= 5000:
        return 90.0 - ((word_count - 2000) / 3000.0) * 20.0
    return 60.0


def _score_text_ratio(text_ratio: float) -> float:
    if text_ratio <= 0:
        return 25.0
    if text_ratio < 5:
        return 35.0 + (text_ratio / 5.0) * 20.0
    if text_ratio < 15:
        return 55.0 + ((text_ratio - 5.0) / 10.0) * 35.0
    if text_ratio <= 35:
        return 100.0
    if text_ratio <= 50:
        return 80.0
    return 65.0


def _score_length(length: int, ideal_min: int, ideal_max: int) -> float:
    if length <= 0:
        return 0.0
    if ideal_min <= length <= ideal_max:
        return 100.0
    if length < ideal_min:
        gap = ideal_min - length
    else:
        gap = length - ideal_max
    return _clamp(100.0 - min(75.0, gap * 1.7))


def _score_readability(flesch: float, readability_label: Any) -> float:
    if flesch > 0:
        if flesch >= 70:
            return 100.0
        if flesch >= 50:
            return 85.0
        if flesch >= 30:
            return 65.0
        return 45.0

    label = str(readability_label or "").strip().lower()
    if not label:
        return 65.0
    if "easy" in label:
        return 90.0
    if "standard" in label:
        return 80.0
    if "difficult" in label:
        return 55.0
    return 65.0


def _score_internal_linking(inlinks: int, outlinks: int, external_outlinks: int) -> float:
    score = 100.0
    if inlinks <= 0:
        score -= 45.0
    elif inlinks < 2:
        score -= 20.0
    if outlinks <= 0:
        score -= 10.0
    if outlinks > 250:
        score -= 20.0
    if external_outlinks > 100:
        score -= 15.0
    return _clamp(score)


def _score_crawl_depth(depth: int) -> float:
    if depth <= 0:
        return 75.0
    if depth <= 2:
        return 100.0
    if depth == 3:
        return 90.0
    if depth == 4:
        return 75.0
    if depth == 5:
        return 60.0
    return 35.0


def compute_technical_health_index(results: Dict[str, Any]) -> Dict[str, Any]:
    """
    Compute a 5-pillar Technical Health Index (0-100).
    """
    crawl = results.get("crawl") if isinstance(results, dict) else {}
    lighthouse = results.get("lighthouse") if isinstance(results, dict) else {}
    lh_desktop = lighthouse.get("desktop", {}) if isinstance(lighthouse, dict) else {}

    robots = crawl.get("robots_txt", {}) if isinstance(crawl, dict) else {}
    sitemap = crawl.get("sitemap_analysis", {}) if isinstance(crawl, dict) else {}
    domain_config = crawl.get("domain_config", {}) if isinstance(crawl, dict) else {}
    semantic_html = crawl.get("semantic_html", {}) if isinstance(crawl, dict) else {}
    render_nojs = crawl.get("render_nojs", {}) if isinstance(crawl, dict) else {}
    soft_404 = crawl.get("soft_404", {}) if isinstance(crawl, dict) else {}
    directives = crawl.get("directives_hreflang", {}) if isinstance(crawl, dict) else {}
    schema_v2 = crawl.get("structured_data_v2", {}) if isinstance(crawl, dict) else {}

    issues_summary: List[Dict[str, Any]] = []

    # Pillar 1: Lighthouse quality
    lh_scores = [
        _to_float(lh_desktop.get("performance_score")),
        _to_float(lh_desktop.get("accessibility_score")),
        _to_float(lh_desktop.get("best_practices_score")),
        _to_float(lh_desktop.get("seo_score")),
    ]
    lh_base = _avg(lh_scores, fallback=0.0)
    lh_diagnostics = len((lh_desktop.get("audits", {}) or {}).get("diagnostics", []) or [])
    lh_opportunities = len((lh_desktop.get("audits", {}) or {}).get("opportunities", []) or [])
    lh_penalty = min(35.0, lh_diagnostics * 1.3 + lh_opportunities * 0.45)
    lighthouse_pillar = _clamp(lh_base - lh_penalty)

    # Pillar 2: Crawl issue burden
    pages_by_status = crawl.get("pages_by_status", {}) if isinstance(crawl, dict) else {}
    technical = crawl.get("technical_seo", {}) if isinstance(crawl, dict) else {}
    links = crawl.get("links", {}) if isinstance(crawl, dict) else {}
    images = crawl.get("images", {}) if isinstance(crawl, dict) else {}

    broken_links = _to_int(links.get("broken"))
    http_errors = _to_int(pages_by_status.get("404")) + _to_int(pages_by_status.get("500")) + _to_int(pages_by_status.get("other"))
    missing_canonical = _to_int(technical.get("missing_canonical"))
    noindex_count = _to_int(technical.get("noindex_pages"))
    missing_alt = _to_int(images.get("without_alt"))
    redirects = _to_int(technical.get("redirects") or links.get("redirects"))
    nofollow_count = _to_int(technical.get("nofollow_pages"))
    hreflang_issues = _to_int(technical.get("hreflang_pages"))
    has_sitemap = bool(crawl.get("has_sitemap"))

    crawl_penalty = 0.0
    crawl_penalty += _scaled_penalty(broken_links, factor=3.8, cap=25.0)
    crawl_penalty += _scaled_penalty(http_errors, factor=4.2, cap=20.0)
    crawl_penalty += _scaled_penalty(missing_canonical, factor=2.6, cap=15.0)
    crawl_penalty += _scaled_penalty(noindex_count, factor=2.5, cap=15.0)
    crawl_penalty += _scaled_penalty(missing_alt, factor=0.9, cap=12.0)
    crawl_penalty += _scaled_penalty(redirects, factor=1.4, cap=10.0)
    crawl_penalty += _scaled_penalty(nofollow_count, factor=1.2, cap=8.0)
    crawl_penalty += _scaled_penalty(hreflang_issues, factor=1.1, cap=8.0)
    if not has_sitemap:
        crawl_penalty += 10.0
    crawl_health_pillar = _clamp(100.0 - crawl_penalty)

    if broken_links > 0:
        issues_summary.append({"key": "broken_links", "severity": "high", "value": broken_links, "message": "Niedzialajace linki obnizaja crawlability i UX."})
    if http_errors > 0:
        issues_summary.append({"key": "http_errors", "severity": "high", "value": http_errors, "message": "Wykryto URL-e z bledami 4xx/5xx."})
    if missing_canonical > 0:
        issues_summary.append({"key": "missing_canonical", "severity": "high", "value": missing_canonical, "message": "Braki canonical utrudniaja konsolidacje sygnalow rankingowych."})

    # Pillar 3: Technical extras
    robots_score = 100.0
    if robots.get("full_block"):
        robots_score -= 50.0
    robots_score -= min(30.0, len(robots.get("issues", []) or []) * 7.0)
    robots_score = _clamp(robots_score)

    sitemap_score = 100.0
    coverage = _to_float(sitemap.get("coverage_pct"), 0.0)
    if coverage > 0:
        if coverage < 60:
            sitemap_score -= 25.0
        elif coverage < 80:
            sitemap_score -= 12.0
    if _to_int(sitemap.get("stale_entries")) > 0:
        sitemap_score -= min(20.0, math.sqrt(_to_int(sitemap.get("stale_entries"))) * 2.0)
    mismatch_count = _to_int(sitemap.get("in_sitemap_not_crawled_count")) + _to_int(sitemap.get("crawled_not_in_sitemap_count"))
    if mismatch_count > 0:
        sitemap_score -= min(20.0, math.sqrt(mismatch_count) * 2.2)
    if not sitemap and not has_sitemap:
        sitemap_score -= 30.0
    sitemap_score = _clamp(sitemap_score)

    domain_score = 100.0
    if not domain_config.get("is_https"):
        domain_score -= 35.0
    domain_score -= min(30.0, len(domain_config.get("issues", []) or []) * 10.0)
    domain_score = _clamp(domain_score)

    render_score = _clamp(_to_float(render_nojs.get("score"), 50.0))

    soft_score = 100.0
    soft_score -= _scaled_penalty(_to_int(soft_404.get("soft_404_count")), factor=4.5, cap=28.0)
    soft_score -= _scaled_penalty(_to_int(soft_404.get("low_content_count")), factor=1.4, cap=18.0)
    soft_score = _clamp(soft_score)

    directives_score = 100.0
    directives_score -= _scaled_penalty(_to_int(directives.get("noindex_count")), factor=2.2, cap=18.0)
    directives_score -= _scaled_penalty(_to_int(directives.get("nofollow_count")), factor=1.8, cap=14.0)
    directives_score -= min(20.0, len(directives.get("issues", []) or []) * 8.0)
    directives_score = _clamp(directives_score)

    tech_extras_pillar = _clamp(
        _avg([robots_score, sitemap_score, domain_score, render_score, soft_score, directives_score], fallback=50.0)
    )

    # Pillar 4: Content readiness
    semantic_score = _clamp(_to_float(semantic_html.get("score"), 50.0))
    schema_score = _clamp(_to_float((schema_v2.get("ai_crawler_readiness") or {}).get("score"), 0.0))

    text_ratio_values: List[float] = []
    for page in (crawl.get("all_pages") or [])[:500]:
        if not isinstance(page, dict):
            continue
        val = _to_float(page.get("text_ratio"), -1.0)
        if val >= 0:
            text_ratio_values.append(val)
    if text_ratio_values:
        avg_text_ratio = _avg(text_ratio_values)
        # Healthy text ratio around 8-25% for many content pages.
        if avg_text_ratio < 4:
            text_ratio_score = 45.0
        elif avg_text_ratio < 8:
            text_ratio_score = 70.0
        elif avg_text_ratio <= 35:
            text_ratio_score = 90.0
        else:
            text_ratio_score = 75.0
    else:
        text_ratio_score = 60.0

    content_pillar = _clamp((semantic_score * 0.45) + (schema_score * 0.45) + (text_ratio_score * 0.10))

    # Pillar 5: Security/transport trust
    https_score = 100.0 if domain_config.get("is_https") else 40.0
    domain_hardening = _clamp(100.0 - min(36.0, len(domain_config.get("issues", []) or []) * 12.0))
    best_practices = _clamp(_to_float(lh_desktop.get("best_practices_score"), 0.0))
    security_pillar = _clamp((https_score * 0.4) + (domain_hardening * 0.3) + (best_practices * 0.3))

    score = round(
        _clamp(
            (lighthouse_pillar * 0.25)
            + (crawl_health_pillar * 0.25)
            + (tech_extras_pillar * 0.20)
            + (content_pillar * 0.15)
            + (security_pillar * 0.15)
        ),
        1,
    )

    breakdown = {
        "lighthouse_pillar": round(lighthouse_pillar, 1),
        "crawl_health_pillar": round(crawl_health_pillar, 1),
        "tech_extras_pillar": round(tech_extras_pillar, 1),
        "content_pillar": round(content_pillar, 1),
        "security_pillar": round(security_pillar, 1),
    }

    components = {
        "lighthouse_avg": round(lh_base, 1),
        "lighthouse_penalty": round(lh_penalty, 1),
        "robots_score": round(robots_score, 1),
        "sitemap_score": round(sitemap_score, 1),
        "domain_score": round(domain_score, 1),
        "render_nojs_score": round(render_score, 1),
        "semantic_score": round(semantic_score, 1),
        "schema_score": round(schema_score, 1),
        "text_ratio_score": round(text_ratio_score, 1),
    }

    return {
        "score": score,
        "grade": _grade_from_score(score),
        "status": _status_from_score(score),
        "weights": {
            "lighthouse_pillar": 0.25,
            "crawl_health_pillar": 0.25,
            "tech_extras_pillar": 0.20,
            "content_pillar": 0.15,
            "security_pillar": 0.15,
        },
        "breakdown": breakdown,
        "components": components,
        "issues_summary": issues_summary[:8],
    }


def compute_visibility_momentum(senuto_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Compute Senuto-driven momentum score in range -100..100.
    """
    visibility = (senuto_data or {}).get("visibility", {}) if isinstance(senuto_data, dict) else {}
    wins = visibility.get("wins") if isinstance(visibility, dict) else []
    losses = visibility.get("losses") if isinstance(visibility, dict) else []

    wins = wins if isinstance(wins, list) else []
    losses = losses if isinstance(losses, list) else []

    sv_gained = sum(_extract_search_volume(row) for row in wins if isinstance(row, dict))
    sv_lost = sum(_extract_search_volume(row) for row in losses if isinstance(row, dict))
    total_sv = sv_gained + sv_lost

    if total_sv > 0:
        score = ((sv_gained - sv_lost) / total_sv) * 100.0
    else:
        score = 0.0
    score = round(max(-100.0, min(100.0, score)), 1)

    if score > 30:
        status = "strong_growth"
    elif score > 10:
        status = "growing"
    elif score < -30:
        status = "critical"
    elif score < -10:
        status = "declining"
    else:
        status = "stable"

    def _normalize_rows(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        normalized: List[Dict[str, Any]] = []
        for row in rows:
            if not isinstance(row, dict):
                continue
            keyword = _extract_keyword(row)
            if not keyword:
                continue
            normalized.append(
                {
                    "keyword": keyword,
                    "search_volume": _extract_search_volume(row),
                    "position_change": round(_extract_position_change(row), 2),
                    "url": row.get("url") or row.get("best_url") or row.get("landing_page") or "",
                }
            )
        return normalized

    normalized_wins = _normalize_rows(wins)
    normalized_losses = _normalize_rows(losses)

    top_wins = sorted(normalized_wins, key=lambda item: item["search_volume"], reverse=True)[:5]
    top_losses = sorted(normalized_losses, key=lambda item: item["search_volume"], reverse=True)[:5]

    return {
        "score": score,
        "status": status,
        "sv_gained": int(sv_gained),
        "sv_lost": int(sv_lost),
        "total_sv_considered": int(total_sv),
        "wins_count": len(wins),
        "losses_count": len(losses),
        "net_keywords": len(wins) - len(losses),
        "top_wins": top_wins,
        "top_losses": top_losses,
    }


def compute_traffic_estimation(senuto_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Estimate monthly organic traffic from Senuto positions using CTR curve.
    """
    visibility = (senuto_data or {}).get("visibility", {}) if isinstance(senuto_data, dict) else {}
    positions = visibility.get("positions") if isinstance(visibility, dict) else []
    rows = [row for row in (positions if isinstance(positions, list) else []) if isinstance(row, dict)]

    by_position_bracket: Dict[str, Dict[str, Any]] = {
        "top3": {"label": "TOP 3", "keywords": 0, "estimated_traffic": 0.0},
        "top4_10": {"label": "TOP 4-10", "keywords": 0, "estimated_traffic": 0.0},
        "top11_20": {"label": "TOP 11-20", "keywords": 0, "estimated_traffic": 0.0},
        "top21_50": {"label": "TOP 21-50", "keywords": 0, "estimated_traffic": 0.0},
        "over50": {"label": "50+", "keywords": 0, "estimated_traffic": 0.0},
    }
    traffic_by_url: Dict[str, float] = {}
    keyword_rows: List[Dict[str, Any]] = []
    opportunities: List[Dict[str, Any]] = []

    total_estimated_monthly = 0.0
    potential_gain = 0.0

    for row in rows:
        keyword = _extract_keyword(row)
        if not keyword:
            continue

        search_volume = max(0, _extract_search_volume(row))
        position = _extract_position(row)
        if position <= 0:
            continue

        url = _extract_url(row)
        current_ctr = _ctr_at(position)
        current_traffic = search_volume * current_ctr
        total_estimated_monthly += current_traffic

        if position <= 3:
            bucket_key = "top3"
        elif position <= 10:
            bucket_key = "top4_10"
        elif position <= 20:
            bucket_key = "top11_20"
        elif position <= 50:
            bucket_key = "top21_50"
        else:
            bucket_key = "over50"

        by_position_bracket[bucket_key]["keywords"] += 1
        by_position_bracket[bucket_key]["estimated_traffic"] += current_traffic

        if url:
            traffic_by_url[url] = traffic_by_url.get(url, 0.0) + current_traffic

        keyword_rows.append(
            {
                "keyword": keyword,
                "position": position,
                "search_volume": int(search_volume),
                "estimated_traffic": round(current_traffic, 2),
                "url": url,
            }
        )

        if 10 <= position <= 20:
            gain = max(0.0, (search_volume * _ctr_at(3)) - current_traffic)
            potential_gain += gain

        if position > 3:
            potential_traffic = search_volume * _ctr_at(3)
            gain = max(0.0, potential_traffic - current_traffic)
            opportunities.append(
                {
                    "keyword": keyword,
                    "search_volume": int(search_volume),
                    "current_pos": position,
                    "target_pos": 3,
                    "current_traffic": round(current_traffic, 2),
                    "potential_traffic": round(potential_traffic, 2),
                    "gain": round(gain, 2),
                    "url": url,
                }
            )

    top_traffic_keywords = sorted(
        keyword_rows, key=lambda item: item.get("estimated_traffic", 0.0), reverse=True
    )[:20]
    top_traffic_urls = sorted(
        [{"url": url, "estimated_traffic": round(value, 2)} for url, value in traffic_by_url.items()],
        key=lambda item: item.get("estimated_traffic", 0.0),
        reverse=True,
    )[:20]
    top_opportunities = sorted(
        opportunities, key=lambda item: item.get("gain", 0.0), reverse=True
    )[:20]

    for data in by_position_bracket.values():
        data["estimated_traffic"] = round(data["estimated_traffic"], 2)

    total_rounded = int(round(total_estimated_monthly))
    potential_gain_rounded = int(round(potential_gain))

    return {
        "total_estimated_monthly": total_rounded,
        "potential_monthly": total_rounded + potential_gain_rounded,
        "potential_gain": potential_gain_rounded,
        "keyword_count": len(keyword_rows),
        "by_position_bracket": by_position_bracket,
        "top_traffic_keywords": top_traffic_keywords,
        "top_traffic_urls": top_traffic_urls,
        "top_opportunities": top_opportunities,
        "ctr_model": {
            "name": "position_based_curve_v1",
            "default_ctr": 0.005,
            "curve": CTR_CURVE,
        },
    }


def compute_content_quality_index(results: Dict[str, Any]) -> Dict[str, Any]:
    """
    Compute per-page Content Quality Index (0-100) and aggregate site score.
    """
    crawl = results.get("crawl") if isinstance(results, dict) else {}
    all_pages = crawl.get("all_pages", []) if isinstance(crawl, dict) else []
    pages = [page for page in (all_pages if isinstance(all_pages, list) else []) if isinstance(page, dict)]

    if not pages:
        return {
            "site_score": 0.0,
            "grade": "F",
            "status": "poor",
            "distribution": {"A": 0, "B": 0, "C": 0, "D": 0, "F": 0},
            "pages": [],
            "top_issues": [],
            "components": {
                "word_count": 0.0,
                "text_ratio": 0.0,
                "title_quality": 0.0,
                "meta_quality": 0.0,
                "h1_quality": 0.0,
                "readability": 0.0,
                "internal_linking": 0.0,
                "crawl_depth": 0.0,
            },
        }

    weights = {
        "word_count": 0.25,
        "text_ratio": 0.15,
        "title_quality": 0.15,
        "meta_quality": 0.10,
        "h1_quality": 0.10,
        "readability": 0.10,
        "internal_linking": 0.10,
        "crawl_depth": 0.05,
    }

    distribution = {"A": 0, "B": 0, "C": 0, "D": 0, "F": 0}
    pages_out: List[Dict[str, Any]] = []
    issue_counter: Dict[str, int] = {}
    component_totals = {key: 0.0 for key in weights}

    for page in pages:
        url = str(page.get("url") or "")
        word_count = _to_int(page.get("word_count"), 0)
        text_ratio = _to_float(page.get("text_ratio"), 0.0)
        title_length = _to_int(page.get("title_length"), 0)
        meta_length = _to_int(page.get("meta_description_length"), 0)
        has_h1 = bool(str(page.get("h1") or "").strip())
        has_multiple_h1 = bool(page.get("has_multiple_h1"))
        title_occurrences = _to_int(page.get("title_occurrences"), 1)
        meta_occurrences = _to_int(page.get("meta_desc_occurrences"), 1)
        h1_occurrences = _to_int(page.get("h1_occurrences"), 1)
        flesch = _to_float(page.get("flesch_reading_ease"), 0.0)
        readability_label = page.get("readability")
        inlinks = _to_int(page.get("inlinks"), 0)
        outlinks = _to_int(page.get("outlinks"), 0)
        external_outlinks = _to_int(page.get("external_outlinks"), 0)
        crawl_depth = _to_int(page.get("crawl_depth"), 0)

        score_word_count = _score_word_count(word_count)
        score_text_ratio = _score_text_ratio(text_ratio)
        score_title = _score_length(title_length, ideal_min=30, ideal_max=60)
        score_meta = _score_length(meta_length, ideal_min=120, ideal_max=160)
        score_h1 = 100.0 if has_h1 and not has_multiple_h1 else (55.0 if has_h1 else 20.0)
        score_readability = _score_readability(flesch, readability_label)
        score_linking = _score_internal_linking(inlinks, outlinks, external_outlinks)
        score_depth = _score_crawl_depth(crawl_depth)

        if title_occurrences > 1:
            score_title = _clamp(score_title - 20.0)
        if meta_occurrences > 1:
            score_meta = _clamp(score_meta - 15.0)
        if h1_occurrences > 1:
            score_h1 = _clamp(score_h1 - 15.0)

        score = _clamp(
            (score_word_count * weights["word_count"])
            + (score_text_ratio * weights["text_ratio"])
            + (score_title * weights["title_quality"])
            + (score_meta * weights["meta_quality"])
            + (score_h1 * weights["h1_quality"])
            + (score_readability * weights["readability"])
            + (score_linking * weights["internal_linking"])
            + (score_depth * weights["crawl_depth"])
        )
        score = round(score, 1)

        issues: List[str] = []
        if word_count < 300:
            issues.append("thin_content")
        if word_count > 5000:
            issues.append("very_long_content")
        if text_ratio < 5:
            issues.append("low_text_ratio")
        if title_length <= 0:
            issues.append("missing_title")
        elif title_length < 30 or title_length > 60:
            issues.append("title_length_out_of_range")
        if meta_length <= 0:
            issues.append("missing_meta_description")
        elif meta_length < 120 or meta_length > 160:
            issues.append("meta_length_out_of_range")
        if not has_h1:
            issues.append("missing_h1")
        if has_multiple_h1:
            issues.append("multiple_h1")
        if inlinks <= 0:
            issues.append("orphan_page")
        if crawl_depth > 4:
            issues.append("deep_page")
        if flesch > 0 and flesch < 30:
            issues.append("hard_to_read")
        if title_occurrences > 1:
            issues.append("duplicate_title")
        if meta_occurrences > 1:
            issues.append("duplicate_meta_description")
        if h1_occurrences > 1:
            issues.append("duplicate_h1")

        for issue in issues:
            issue_counter[issue] = issue_counter.get(issue, 0) + 1

        grade = _grade_from_score(score)
        distribution[grade] = distribution.get(grade, 0) + 1

        component_totals["word_count"] += score_word_count
        component_totals["text_ratio"] += score_text_ratio
        component_totals["title_quality"] += score_title
        component_totals["meta_quality"] += score_meta
        component_totals["h1_quality"] += score_h1
        component_totals["readability"] += score_readability
        component_totals["internal_linking"] += score_linking
        component_totals["crawl_depth"] += score_depth

        pages_out.append(
            {
                "url": url,
                "score": score,
                "grade": grade,
                "status": _cqi_status(score),
                "issues": issues,
                "word_count": word_count,
                "text_ratio": round(text_ratio, 2),
                "title_length": title_length,
                "meta_description_length": meta_length,
                "inlinks": inlinks,
                "crawl_depth": crawl_depth,
            }
        )

    pages_out.sort(key=lambda item: item.get("score", 0.0))
    site_score = round(_avg([_to_float(page.get("score")) for page in pages_out], fallback=0.0), 1)

    top_issues = [
        {"issue": issue, "count": count}
        for issue, count in sorted(issue_counter.items(), key=lambda item: item[1], reverse=True)[:10]
    ]

    pages_count = max(1, len(pages_out))
    components = {
        key: round(total / pages_count, 1) for key, total in component_totals.items()
    }

    return {
        "site_score": site_score,
        "grade": _grade_from_score(site_score),
        "status": _cqi_status(site_score),
        "distribution": distribution,
        "pages_count": len(pages_out),
        "pages": pages_out,
        "top_issues": top_issues,
        "weights": weights,
        "components": components,
    }
