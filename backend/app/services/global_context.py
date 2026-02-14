import json
from typing import Any, Dict, Optional


def _to_number(value: Any, default: float = 0.0) -> float:
    try:
        if value is None:
            return default
        if isinstance(value, (int, float)):
            return float(value)
        s = str(value).strip().replace(",", ".")
        return float(s) if s else default
    except Exception:
        return default


def _extract_aio_from_senuto(senuto: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Canonical AIO data lives in Senuto payload under:
      senuto.visibility.ai_overviews.{statistics,keywords,competitors}

    We intentionally prefer that structure over any partial AIO numbers that
    may exist in generic visibility statistics.
    """
    if not isinstance(senuto, dict):
        return {"has_aio": False, "stats": {}, "keywords_sample": []}

    vis = senuto.get("visibility") or {}
    aio = (vis.get("ai_overviews") or {}) if isinstance(vis, dict) else {}
    stats = aio.get("statistics") or {}
    keywords = aio.get("keywords") or []

    aio_keywords_with_domain = _to_number(stats.get("aio_keywords_with_domain_count"), default=0.0)
    aio_keywords_count = _to_number(stats.get("aio_keywords_count"), default=0.0)

    has_aio = bool(aio_keywords_with_domain > 0 or aio_keywords_count > 0 or (isinstance(keywords, list) and len(keywords) > 0))

    keywords_sample = []
    if isinstance(keywords, list):
        for k in keywords[:5]:
            if not isinstance(k, dict):
                continue
            keywords_sample.append(
                {
                    "keyword": str(k.get("keyword") or ""),
                    "best_aio_pos": k.get("best_aio_pos"),
                    "organic_pos": k.get("organic_pos"),
                }
            )

    return {
        "has_aio": has_aio,
        "stats": {
            "aio_keywords_with_domain_count": aio_keywords_with_domain,
            "aio_keywords_count": aio_keywords_count,
            "aio_avg_pos": _to_number(stats.get("aio_avg_pos"), default=0.0),
            "aio_wins_count": _to_number(stats.get("aio_wins_count"), default=0.0),
            "aio_losses_count": _to_number(stats.get("aio_losses_count"), default=0.0),
            "aio_vis_loss_percentage": _to_number(stats.get("aio_vis_loss_percentage"), default=0.0),
        },
        "keywords_sample": keywords_sample,
    }


def build_global_snapshot(
    *,
    crawl: Optional[Dict[str, Any]] = None,
    lighthouse: Optional[Dict[str, Any]] = None,
    senuto: Optional[Dict[str, Any]] = None,
    extra: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Small cross-module snapshot injected into AI prompts to prevent contradictions.
    Keep it compact: flags + a few canonical metrics only.
    """
    crawl = crawl or {}
    lighthouse = lighthouse or {}
    senuto = senuto or {}

    aio = _extract_aio_from_senuto(senuto)

    lh_desktop = (lighthouse.get("desktop") or {}) if isinstance(lighthouse, dict) else {}
    lh_mobile = (lighthouse.get("mobile") or {}) if isinstance(lighthouse, dict) else {}

    vis_stats = {}
    if isinstance(senuto, dict) and isinstance(senuto.get("visibility"), dict):
        vis_stats = (senuto.get("visibility") or {}).get("statistics", {}).get("statistics", {}) or {}

    snapshot: Dict[str, Any] = {
        "url": str(crawl.get("url") or ""),
        "pages_crawled": int(_to_number(crawl.get("pages_crawled"), default=0.0)),
        "lighthouse": {
            "desktop_perf": int(_to_number(lh_desktop.get("performance_score"), default=0.0)),
            "mobile_perf": int(_to_number(lh_mobile.get("performance_score"), default=0.0)),
            "desktop_seo": int(_to_number(lh_desktop.get("seo_score"), default=0.0)),
        },
        "visibility": {
            "top3": _to_number(vis_stats.get("top3"), default=0.0),
            "top10": _to_number(vis_stats.get("top10"), default=0.0),
            "top50": _to_number(vis_stats.get("top50"), default=0.0),
            "domain_rank": _to_number(vis_stats.get("domain_rank"), default=0.0),
        },
        "ai_overviews": aio,
    }

    if isinstance(extra, dict) and extra:
        # Ensure serializable & compact.
        snapshot["extra"] = {k: v for k, v in extra.items() if k and v is not None}

    return snapshot


def format_global_snapshot_for_prompt(snapshot: Optional[Dict[str, Any]]) -> str:
    if not snapshot:
        return ""
    # Ensure ASCII-only output for prompts.
    blob = json.dumps(snapshot, ensure_ascii=True, separators=(",", ":"), sort_keys=True)
    return (
        "GLOBAL_SNAPSHOT (canonical, cross-module facts; do not contradict):\n"
        f"{blob}\n\n"
        "Rules:\n"
        "- If you do not have data for a topic, say \"brak danych\" (do not guess).\n"
        "- If module-local numbers conflict with GLOBAL_SNAPSHOT, treat GLOBAL_SNAPSHOT as canonical and mention a potential mismatch.\n"
        "- Do not claim \"brak AIO\" when GLOBAL_SNAPSHOT.ai_overviews.has_aio=true.\n"
    )

