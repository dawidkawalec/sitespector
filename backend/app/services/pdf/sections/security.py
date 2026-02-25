"""Data extractor for Security section."""

from typing import Any, Dict
from ..utils import safe_float, safe_int


def extract(audit_data: Dict[str, Any]) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    sec_data = results.get("security") or {}
    ai_contexts = results.get("ai_contexts") or {}
    sec_ai = ai_contexts.get("security") or {}

    return {
        "sec": {
            "security_score": safe_float(sec_data.get("security_score")),
            "is_https": bool(sec_data.get("is_https")),
            "ssl_valid": bool(sec_data.get("ssl_valid", sec_data.get("is_https"))),
            "mixed_content_count": safe_int(sec_data.get("mixed_content_count")),
            "vulnerabilities_count": len(sec_data.get("vulnerabilities") or []),
            "vulnerabilities": sec_data.get("vulnerabilities") or [],
            "hsts": bool(sec_data.get("hsts")),
            "csp": bool(sec_data.get("csp") or sec_data.get("content_security_policy")),
            "x_frame_options": bool(sec_data.get("x_frame_options")),
            "x_content_type": bool(sec_data.get("x_content_type") or sec_data.get("x_content_type_options")),
            "referrer_policy": bool(sec_data.get("referrer_policy")),
            "recommendations": sec_data.get("recommendations") or [],
            "ai_key_findings": sec_ai.get("key_findings") or [],
        }
    }
