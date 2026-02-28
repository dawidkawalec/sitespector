"""Data extractor for Position Changes section."""

from typing import Any, Dict
from ..utils import safe_int, as_list


def extract(audit_data: Dict[str, Any], max_rows: int = 20) -> Dict[str, Any]:
    results = audit_data.get("results") or {}
    senuto = results.get("senuto") or {}
    vis = senuto.get("visibility") or {}
    meta = senuto.get("_meta") or {}
    wins = as_list(vis.get("wins"))
    losses = as_list(vis.get("losses"))
    cannibalization_raw = vis.get("cannibalization")
    if isinstance(cannibalization_raw, dict):
        cannibalization = as_list(cannibalization_raw.get("keywords") or cannibalization_raw.get("data"))
    else:
        cannibalization = as_list(cannibalization_raw)

    # Normalize wins/losses: need keyword, position_before, position_after, change
    def _normalize_changes(items, direction="win"):
        result = []
        for item in items[:max_rows]:
            kw = item.get("keyword", "")
            pos_now = safe_int(item.get("position") or item.get("position_after"))
            pos_before = safe_int(item.get("position_before"))
            if pos_before and pos_now:
                change = abs(pos_before - pos_now)
            else:
                change = safe_int(item.get("change") or item.get("position_change"))
            result.append({
                "keyword": kw,
                "position_before": pos_before or "—",
                "position_after": pos_now,
                "change": change,
            })
        return result

    top_wins = _normalize_changes(sorted(wins, key=lambda x: -safe_int(x.get("change") or x.get("position_change", 0)))[:max_rows])
    top_losses = _normalize_changes(sorted(losses, key=lambda x: -safe_int(x.get("change") or x.get("position_change", 0)))[:max_rows])

    return {
        "changes": {
            "wins_count": safe_int(meta.get("wins_count") or len(wins)),
            "losses_count": safe_int(meta.get("losses_count") or len(losses)),
            "new_keywords_count": 0,
            "lost_keywords_count": 0,
            "top_wins": top_wins,
            "top_losses": top_losses,
            "cannibalization": cannibalization[:20],
        }
    }
