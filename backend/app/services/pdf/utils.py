"""
Utility functions for PDF report generation.
"""

from typing import Any, Dict, List, Optional, Tuple


# ---------- Score helpers ----------

def score_color(score: float) -> str:
    """Return CSS color class based on score 0-100."""
    if score >= 80:
        return "#16a34a"   # green
    elif score >= 50:
        return "#ca8a04"   # yellow
    else:
        return "#dc2626"   # red


def score_label(score: float) -> str:
    """Return Polish label for score."""
    if score >= 80:
        return "Dobry"
    elif score >= 50:
        return "Wymaga uwagi"
    else:
        return "Krytyczny"


def score_badge_class(score: float) -> str:
    """Return badge CSS class for score."""
    if score >= 80:
        return "badge-success"
    elif score >= 50:
        return "badge-warning"
    else:
        return "badge-danger"


def health_color(health: str) -> str:
    """Return color for health status string."""
    mapping = {
        "good": "#16a34a",
        "moderate": "#ca8a04",
        "poor": "#dc2626",
        "critical": "#7f1d1d",
    }
    return mapping.get(health, "#64748b")


def health_label_pl(health: str) -> str:
    mapping = {
        "good": "Dobry",
        "moderate": "Umiarkowany",
        "poor": "Słaby",
        "critical": "Krytyczny",
    }
    return mapping.get(health, health or "N/A")


# ---------- Formatting helpers ----------

def fmt_bytes(b: Optional[int]) -> str:
    """Format bytes to human-readable string."""
    if b is None:
        return "N/A"
    if b >= 1_048_576:
        return f"{b / 1_048_576:.1f} MB"
    elif b >= 1024:
        return f"{b / 1024:.1f} KB"
    return f"{b} B"


def fmt_ms(ms: Optional[float]) -> str:
    """Format milliseconds."""
    if ms is None:
        return "N/A"
    if ms >= 1000:
        return f"{ms / 1000:.2f}s"
    return f"{int(ms)}ms"


def fmt_score(v: Optional[float]) -> str:
    """Format score 0-100."""
    if v is None:
        return "N/A"
    return f"{round(v)}"


def fmt_number(v: Optional[float], decimals: int = 0) -> str:
    """Format a number with optional decimals."""
    if v is None:
        return "N/A"
    if decimals == 0:
        return f"{int(round(v)):,}".replace(",", " ")
    return f"{v:.{decimals}f}"


def fmt_pct(v: Optional[float]) -> str:
    """Format as percentage."""
    if v is None:
        return "N/A"
    return f"{round(v)}%"


def truncate(text: str, max_len: int = 80) -> str:
    """Truncate text with ellipsis."""
    if not text:
        return ""
    text = str(text)
    if len(text) <= max_len:
        return text
    return text[: max_len - 3] + "…"


# ---------- CWV threshold helpers ----------

def cwv_status(metric: str, value: Optional[float]) -> Tuple[str, str]:
    """
    Return (status_label, color) for a Core Web Vitals metric.
    metric: 'lcp' | 'cls' | 'fcp' | 'tbt' | 'ttfb' | 'si'
    value: raw ms value (or ratio for CLS)
    """
    if value is None:
        return ("N/A", "#94a3b8")

    thresholds = {
        "lcp":  (2500, 4000),    # ms
        "fcp":  (1800, 3000),    # ms
        "tbt":  (200, 600),      # ms
        "ttfb": (800, 1800),     # ms
        "si":   (3400, 5800),    # ms
        "cls":  (0.1, 0.25),     # ratio (value passed as x1000 internally if ms unit)
    }
    good_th, poor_th = thresholds.get(metric, (0, 0))

    if metric == "cls":
        # CLS value is a ratio (e.g. 0.05), not ms
        if value <= good_th:
            return ("Dobry", "#16a34a")
        elif value <= poor_th:
            return ("Wymaga poprawy", "#ca8a04")
        else:
            return ("Słaby", "#dc2626")
    else:
        if value <= good_th:
            return ("Dobry", "#16a34a")
        elif value <= poor_th:
            return ("Wymaga poprawy", "#ca8a04")
        else:
            return ("Słaby", "#dc2626")


# ---------- Data extraction helpers ----------

def safe_get(data: Dict, *keys, default=None) -> Any:
    """Safely traverse nested dict."""
    current = data
    for key in keys:
        if not isinstance(current, dict):
            return default
        current = current.get(key, default)
        if current is None:
            return default
    return current


def as_list(v, default=None) -> list:
    """Ensure value is a list. Returns [] (or default) if not a list."""
    if isinstance(v, list):
        return v
    return default if default is not None else []


def safe_int(v, default: int = 0) -> int:
    try:
        return int(v or 0)
    except (TypeError, ValueError):
        return default


def safe_float(v, default: float = 0.0) -> float:
    try:
        return float(v or 0)
    except (TypeError, ValueError):
        return default


def impact_color(impact: str) -> str:
    mapping = {
        "high": "#dc2626",
        "medium": "#ca8a04",
        "low": "#16a34a",
    }
    return mapping.get(impact, "#64748b")


def effort_label_pl(effort: str) -> str:
    mapping = {
        "easy": "Łatwe",
        "medium": "Średnie",
        "hard": "Trudne",
    }
    return mapping.get(effort, effort or "N/A")


def impact_label_pl(impact: str) -> str:
    mapping = {
        "high": "Wysoki",
        "medium": "Średni",
        "low": "Niski",
    }
    return mapping.get(impact, impact or "N/A")


def priority_label_pl(priority: str) -> str:
    mapping = {
        "critical": "Krytyczny",
        "high": "Wysoki",
        "medium": "Średni",
        "low": "Niski",
    }
    return mapping.get(priority, priority or "N/A")


def priority_color(priority: str) -> str:
    mapping = {
        "critical": "#7f1d1d",
        "high": "#dc2626",
        "medium": "#ca8a04",
        "low": "#16a34a",
    }
    return mapping.get(priority, "#64748b")


def module_label_pl(module: str) -> str:
    mapping = {
        "seo": "SEO",
        "performance": "Wydajność",
        "visibility": "Widoczność",
        "ai_overviews": "AI Overviews",
        "links": "Linki",
        "images": "Obrazy",
        "ux": "UX",
        "security": "Bezpieczeństwo",
        "content": "Treść",
    }
    return mapping.get(module, module or "Ogólne")


def intent_label_pl(intent: str) -> str:
    mapping = {
        "informational": "Informacyjne",
        "navigational": "Nawigacyjne",
        "transactional": "Transakcyjne",
        "commercial": "Komercyjne",
    }
    return mapping.get(intent, intent or "N/A")


def status_badge_class(code: int) -> str:
    if code == 200:
        return "badge-success"
    elif code in (301, 302, 307, 308):
        return "badge-warning"
    elif code == 404:
        return "badge-danger"
    else:
        return "badge-info"


# ---------- Section skip notes ----------

def build_skipped_sections_notes(cfg, results: Dict) -> List[Dict]:
    """
    Return list of {section_id, label, reason} for sections skipped due to missing data.
    """
    skipped = []
    senuto = results.get("senuto", {})
    has_senuto = bool(senuto and senuto.get("visibility"))
    has_aio = bool(senuto and senuto.get("visibility", {}).get("ai_overviews", {}).get("keywords"))
    has_competitors = bool(results.get("competitive_analysis", {}).get("competitors_analyzed", 0) > 0)

    checks = [
        ("visibility_overview", "Widoczność organiczna", has_senuto, "Brak danych Senuto"),
        ("keywords", "Słowa kluczowe", has_senuto, "Brak danych Senuto"),
        ("position_changes", "Zmiany pozycji", has_senuto, "Brak danych Senuto"),
        ("organic_competitors", "Konkurencja organiczna", has_senuto, "Brak danych Senuto"),
        ("backlinks", "Profil linków przychodzących", has_senuto, "Brak danych Senuto"),
        ("ai_overviews", "AI Overviews", has_aio, "Brak danych AI Overviews"),
    ]
    for sid, label, has_data, reason in checks:
        if cfg.is_enabled(sid) and not has_data:
            skipped.append({"section_id": sid, "label": label, "reason": reason})
    return skipped
