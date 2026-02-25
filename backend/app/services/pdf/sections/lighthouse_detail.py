"""Data extractor for Lighthouse Detail section."""

from typing import Any, Dict, List


def _filter_audits(audits_dict: Dict, category: str, max_rows: int) -> List[Dict]:
    items = audits_dict.get(category) or []
    # Sort by score ascending (worst first)
    items = sorted(items, key=lambda x: x.get("score") or 0)
    return items[:max_rows]


def extract(audit_data: Dict[str, Any], max_rows: int = 15, extended: bool = False) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    lh = results.get("lighthouse") or {}
    desktop = lh.get("desktop") or {}
    mobile = lh.get("mobile") or {}

    desktop_audits = desktop.get("audits") or {}
    mobile_audits = mobile.get("audits") or {}

    opp_limit = max_rows if not extended else 50
    diag_limit = max_rows if not extended else 30
    passed_limit = 100 if extended else 0

    desktop_opps = _filter_audits(desktop_audits, "opportunities", opp_limit)
    desktop_diags = _filter_audits(desktop_audits, "diagnostics", diag_limit)
    desktop_passed = _filter_audits(desktop_audits, "passed", passed_limit)

    # Mobile-only opportunities (different from desktop)
    mobile_opps = _filter_audits(mobile_audits, "opportunities", 10)
    desktop_opp_ids = {o.get("id") for o in desktop_opps}
    mobile_only_opps = [o for o in mobile_opps if o.get("id") not in desktop_opp_ids]

    return {
        "lh": {
            "opportunities": desktop_opps,
            "diagnostics": desktop_diags,
            "passed": desktop_passed,
            "mobile_opportunities": mobile_only_opps,
        },
        "extended": extended,
    }
