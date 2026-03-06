"""Data extractor for Security section."""

from typing import Any, Dict, List
from ..utils import safe_float, safe_int


# Security header definitions with descriptions and recommendations
SECURITY_HEADERS = [
    {
        "key": "hsts",
        "alt_keys": ["strict_transport_security"],
        "name": "HSTS (Strict-Transport-Security)",
        "description": "Wymusza HTTPS przez określony czas. Chroni przed downgrade attacks.",
        "recommendation": "Dodaj nagłówek: Strict-Transport-Security: max-age=31536000; includeSubDomains",
        "severity": "high",
    },
    {
        "key": "content_security_policy",
        "alt_keys": ["csp"],
        "name": "Content-Security-Policy (CSP)",
        "description": "Definiuje skąd przeglądarka może ładować zasoby. Zapobiega atakom XSS.",
        "recommendation": "Wdróż CSP dostosowane do struktury zasobów strony. Zacznij od trybu report-only.",
        "severity": "high",
    },
    {
        "key": "x_frame_options",
        "alt_keys": [],
        "name": "X-Frame-Options",
        "description": "Blokuje osadzanie strony w iframach na obcych domenach. Chroni przed Clickjacking.",
        "recommendation": "Dodaj nagłówek: X-Frame-Options: SAMEORIGIN",
        "severity": "medium",
    },
    {
        "key": "x_content_type_options",
        "alt_keys": ["x_content_type"],
        "name": "X-Content-Type-Options",
        "description": "Blokuje przeglądarkę przed zgadywaniem typu MIME zasobów. Chroni przed MIME sniffing.",
        "recommendation": "Dodaj nagłówek: X-Content-Type-Options: nosniff",
        "severity": "medium",
    },
    {
        "key": "referrer_policy",
        "alt_keys": [],
        "name": "Referrer-Policy",
        "description": "Kontroluje jakie informacje o URL są przekazywane przy przejściu na inne strony.",
        "recommendation": "Dodaj nagłówek: Referrer-Policy: strict-origin-when-cross-origin",
        "severity": "low",
    },
    {
        "key": "permissions_policy",
        "alt_keys": ["feature_policy"],
        "name": "Permissions-Policy",
        "description": "Kontroluje dostęp do funkcji przeglądarki (kamera, mikrofon, geolokacja).",
        "recommendation": "Dodaj nagłówek: Permissions-Policy: camera=(), microphone=(), geolocation=()",
        "severity": "low",
    },
]


def _check_header(sec_data: Dict, header_def: Dict) -> Dict:
    """Check a security header and return its status."""
    value = sec_data.get(header_def["key"])
    for alt in header_def.get("alt_keys", []):
        if value is None:
            value = sec_data.get(alt)

    present = bool(value)
    return {
        "name": header_def["name"],
        "description": header_def["description"],
        "recommendation": header_def["recommendation"],
        "severity": header_def["severity"],
        "present": present,
        "value": str(value) if present and not isinstance(value, bool) else "",
    }


def extract(audit_data: Dict[str, Any]) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    sec_data = results.get("security") or {}
    ai_contexts = results.get("ai_contexts") or {}
    sec_ai = ai_contexts.get("security") or {}

    # Evaluate all security headers
    headers_analysis = [_check_header(sec_data, h) for h in SECURITY_HEADERS]
    headers_missing = [h for h in headers_analysis if not h["present"]]
    headers_present = [h for h in headers_analysis if h["present"]]

    missing_high = [h for h in headers_missing if h["severity"] == "high"]
    missing_medium = [h for h in headers_missing if h["severity"] == "medium"]

    # Security score calculation
    total = len(SECURITY_HEADERS)
    present_count = len(headers_present)
    is_https_bonus = 20 if sec_data.get("is_https") else 0
    header_based_score = min(int((present_count / total) * 70) + is_https_bonus, 100)

    raw_security_score = sec_data.get("security_score")
    if raw_security_score is None:
        security_score = float(header_based_score)
    else:
        security_score = safe_float(raw_security_score)

    score_consistency_warning = abs(security_score - header_based_score) >= 25
    score_consistency_note = (
        "Wynik Security Score pochodzi ze źródła audytu i różni się od oceny "
        "nagłówków HTTP. Traktuj ten wynik jako sygnał łączny (HTTPS + konfiguracja), "
        "a listę nagłówków jako checklistę wdrożeniową."
        if score_consistency_warning
        else ""
    )

    return {
        "sec": {
            "security_score": security_score,
            "header_based_score": header_based_score,
            "score_consistency_warning": score_consistency_warning,
            "score_consistency_note": score_consistency_note,
            "is_https": bool(sec_data.get("is_https")),
            "ssl_valid": bool(sec_data.get("ssl_valid", sec_data.get("is_https"))),
            "mixed_content_count": safe_int(sec_data.get("mixed_content_count")),
            "vulnerabilities_count": len(sec_data.get("vulnerabilities") or []),
            "vulnerabilities": sec_data.get("vulnerabilities") or [],
            # Header analysis
            "headers_all": headers_analysis,
            "headers_missing": headers_missing,
            "headers_present": headers_present,
            "missing_high_severity": missing_high,
            "missing_medium_severity": missing_medium,
            "headers_present_count": len(headers_present),
            "headers_total": len(SECURITY_HEADERS),
            # Legacy fields
            "hsts": bool(sec_data.get("hsts") or sec_data.get("strict_transport_security")),
            "csp": bool(sec_data.get("csp") or sec_data.get("content_security_policy")),
            "x_frame_options": bool(sec_data.get("x_frame_options")),
            "x_content_type": bool(sec_data.get("x_content_type") or sec_data.get("x_content_type_options")),
            "referrer_policy": bool(sec_data.get("referrer_policy")),
            "recommendations": sec_data.get("recommendations") or [],
            "ai_key_findings": sec_ai.get("key_findings") or [],
            "ai_recommendations": sec_ai.get("recommendations") or [],
        }
    }
