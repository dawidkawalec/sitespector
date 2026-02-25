"""Data extractor for Content section."""

from typing import Any, Dict
from ..utils import safe_float, safe_int


def extract(audit_data: Dict[str, Any]) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    content_analysis = results.get("content_analysis") or {}
    content_deep = results.get("content_deep") or {}
    crawl = results.get("crawl") or {}
    ai_contexts = results.get("ai_contexts") or {}
    seo_ai = ai_contexts.get("seo") or {}

    return {
        "content": {
            "quality_score": safe_float(content_analysis.get("quality_score")),
            "readability_score": safe_float(content_analysis.get("readability_score")),
            "word_count": safe_int(content_analysis.get("word_count") or crawl.get("word_count")),
            "flesch_score": safe_float(content_analysis.get("readability_score") or crawl.get("flesch_reading_ease")),
            "thin_content_count": safe_int(content_deep.get("thin_content_count")),
            "duplicate_count": safe_int(content_deep.get("duplicate_content_count")),
            "has_title": bool(content_analysis.get("has_title")),
            "has_meta_description": bool(content_analysis.get("has_meta_description")),
            "has_h1": bool(content_analysis.get("has_h1")),
            "tone_voice": content_analysis.get("tone_voice") or "",
            "summary": content_analysis.get("summary") or "",
            "recommendations": content_analysis.get("recommendations") or [],
            "ai_key_findings": seo_ai.get("key_findings") or [],
            "ai_quick_wins": seo_ai.get("quick_wins") or [],
        }
    }
