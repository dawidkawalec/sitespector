"""Data extractor for Tech Stack section."""

from typing import Any, Dict


def extract(audit_data: Dict[str, Any]) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    ts = results.get("tech_stack") or {}

    from ..utils import as_list
    technologies = as_list(ts.get("technologies"))
    # Normalize to list of {name, category, version}
    normalized_techs = []
    for t in technologies:
        if isinstance(t, dict):
            normalized_techs.append({
                "name": t.get("name") or t.get("technology") or str(t),
                "category": t.get("category") or t.get("type") or "Inne",
                "version": t.get("version") or "",
            })
        elif isinstance(t, str):
            normalized_techs.append({"name": t, "category": "Inne", "version": ""})

    return {
        "stack": {
            "technologies": normalized_techs,
            "web_server": ts.get("web_server") or ts.get("server") or "",
            "protocol": ts.get("protocol") or ts.get("http_version") or "",
            "cdn": ts.get("cdn") or "",
            "recommendations": ts.get("recommendations") or [],
        }
    }
