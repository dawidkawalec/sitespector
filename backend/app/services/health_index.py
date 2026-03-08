"""
Composite scoring services for audit quick-win indicators.
"""

from __future__ import annotations

import math
from typing import Any, Dict, List


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
