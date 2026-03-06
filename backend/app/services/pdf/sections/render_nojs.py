"""Data extractor for Render without JavaScript section."""

from typing import Any, Dict

from ..utils import safe_int


def extract(audit_data: Dict[str, Any]) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    crawl = results.get("crawl") or {}
    render = crawl.get("render_nojs") or {}

    return {
        "render_nojs": {
            "has_data": bool(render),
            "score": safe_int(render.get("score")),
            "status": render.get("status") or "unknown",
            "text_length": safe_int(render.get("text_length")),
            "scripts_count": safe_int(render.get("scripts_count")),
            "noscript_count": safe_int(render.get("noscript_count")),
            "links_count": safe_int(render.get("links_count")),
            "has_main": bool(render.get("has_main")),
            "likely_spa_shell": bool(render.get("likely_spa_shell")),
            "issues": render.get("issues") or [],
            "recommendations": render.get("recommendations") or [],
        }
    }
