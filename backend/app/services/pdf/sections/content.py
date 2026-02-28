"""Data extractor for Content section."""

from typing import Any, Dict, List
from ..utils import safe_float, safe_int


def _get_readability_label(score: float) -> str:
    if score >= 90:
        return "Bardzo łatwy (standard języka szkolnego kl. 1-5)"
    elif score >= 70:
        return "Łatwy (do czytania przez każdego)"
    elif score >= 50:
        return "Przeciętny (odpowiedni dla licealistów)"
    elif score >= 30:
        return "Trudny (wymagający dla szerokiej publiczności)"
    else:
        return "Bardzo trudny (tekst akademicki / specjalistyczny)"


def _analyze_content_pages(all_pages: List[Dict]) -> Dict:
    """Analyze content quality across all pages."""
    indexable = [p for p in all_pages if p.get("status_code") == 200]
    if not indexable:
        return {}

    # Word count distribution
    word_buckets = {"0-100": 0, "100-300": 0, "300-600": 0, "600-1000": 0, "1000+": 0}
    for p in indexable:
        wc = safe_int(p.get("word_count"))
        if wc < 100:
            word_buckets["0-100"] += 1
        elif wc < 300:
            word_buckets["100-300"] += 1
        elif wc < 600:
            word_buckets["300-600"] += 1
        elif wc < 1000:
            word_buckets["600-1000"] += 1
        else:
            word_buckets["1000+"] += 1

    # Readability distribution
    flesch_scores = [safe_float(p.get("flesch_reading_ease")) for p in indexable if p.get("flesch_reading_ease")]
    avg_flesch = round(sum(flesch_scores) / len(flesch_scores), 1) if flesch_scores else None

    # Best/worst content pages
    pages_with_words = [p for p in indexable if p.get("word_count")]
    pages_sorted_words = sorted(pages_with_words, key=lambda x: safe_int(x.get("word_count")), reverse=True)
    top_content = [
        {"url": p.get("url", ""), "title": (p.get("title") or "")[:50], "word_count": safe_int(p.get("word_count"))}
        for p in pages_sorted_words[:10]
    ]
    thin_pages = [
        {"url": p.get("url", ""), "title": (p.get("title") or "")[:50], "word_count": safe_int(p.get("word_count"))}
        for p in indexable if safe_int(p.get("word_count")) < 300
    ]

    return {
        "word_buckets": word_buckets,
        "avg_flesch": avg_flesch,
        "flesch_label": _get_readability_label(avg_flesch) if avg_flesch is not None else "",
        "top_content_pages": top_content,
        "thin_pages": thin_pages[:20],
    }


def extract(audit_data: Dict[str, Any]) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    content_analysis = results.get("content_analysis") or {}
    content_deep = results.get("content_deep") or {}
    crawl = results.get("crawl") or {}
    ai_contexts = results.get("ai_contexts") or {}
    seo_ai = ai_contexts.get("seo") or {}
    all_pages = crawl.get("all_pages") or []

    page_analysis = _analyze_content_pages(all_pages)

    return {
        "content": {
            "quality_score": safe_float(content_analysis.get("quality_score")),
            "readability_score": safe_float(content_analysis.get("readability_score")),
            "word_count": safe_int(content_analysis.get("word_count") or crawl.get("word_count")),
            "flesch_score": page_analysis.get("avg_flesch") or safe_float(content_analysis.get("readability_score") or crawl.get("flesch_reading_ease")),
            "flesch_label": page_analysis.get("flesch_label", ""),
            "thin_content_count": safe_int(content_deep.get("thin_content_count") or len(page_analysis.get("thin_pages", []))),
            "duplicate_count": safe_int(content_deep.get("duplicate_content_count")),
            "has_title": bool(content_analysis.get("has_title")),
            "has_meta_description": bool(content_analysis.get("has_meta_description")),
            "has_h1": bool(content_analysis.get("has_h1")),
            "tone_voice": content_analysis.get("tone_voice") or "",
            "summary": content_analysis.get("summary") or "",
            "recommendations": content_analysis.get("recommendations") or [],
            "ai_key_findings": seo_ai.get("key_findings") or [],
            "ai_quick_wins": seo_ai.get("quick_wins") or [],
            # Page-level analysis
            "word_buckets": page_analysis.get("word_buckets", {}),
            "top_content_pages": page_analysis.get("top_content_pages", []),
            "thin_pages": page_analysis.get("thin_pages", []),
        }
    }
