"""Data extractor for semantic HTML section."""

from typing import Any, Dict

from ..utils import safe_int


def extract(audit_data: Dict[str, Any]) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    crawl = results.get("crawl") or {}
    semantic = crawl.get("semantic_html") or {}
    elements = semantic.get("elements") or {}

    return {
        "semantic": {
            "has_data": bool(semantic),
            "score": safe_int(semantic.get("score")),
            "has_issues": bool(semantic.get("has_issues")),
            "issues": semantic.get("issues") or [],
            "recommendations": semantic.get("recommendations") or [],
            "divs_count": safe_int(semantic.get("divs_count")),
            "semantic_total": safe_int(semantic.get("semantic_total")),
            "elements": {
                "header": safe_int(elements.get("header")),
                "nav": safe_int(elements.get("nav")),
                "main": safe_int(elements.get("main")),
                "article": safe_int(elements.get("article")),
                "section": safe_int(elements.get("section")),
                "aside": safe_int(elements.get("aside")),
                "footer": safe_int(elements.get("footer")),
                "figure": safe_int(elements.get("figure")),
                "figcaption": safe_int(elements.get("figcaption")),
            },
        }
    }
