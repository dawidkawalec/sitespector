"""Data extractor for Accessibility section."""

from typing import Any, Dict
from ..utils import safe_float, safe_int


def extract(audit_data: Dict[str, Any]) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    ux_data = results.get("ux") or {}
    lh = results.get("lighthouse") or {}
    desktop = lh.get("desktop") or {}
    crawl = results.get("crawl") or {}
    ai_contexts = results.get("ai_contexts") or {}
    ux_ai = ai_contexts.get("ux") or {}

    images_data = crawl.get("images") or {}
    images_without_alt = safe_int(images_data.get("without_alt") or crawl.get("images_without_alt"))

    accessibility_score = safe_float(
        ux_data.get("accessibility_score") or desktop.get("accessibility_score")
    )

    return {
        "acc": {
            "accessibility_score": accessibility_score,
            "mobile_friendly": bool(ux_data.get("mobile_friendly")),
            "color_contrast_ok": ux_data.get("color_contrast_ok", True),
            "heading_hierarchy_ok": ux_data.get("heading_hierarchy_ok", True),
            "images_without_alt": images_without_alt,
            "images_alt_ok": images_without_alt == 0,
            "form_labels_ok": ux_data.get("form_labels_ok", True),
            "issues": ux_data.get("issues") or [],
            "ai_recommendations": ux_ai.get("recommendations") or [],
        }
    }
