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
    def _normalize_changes(items):
        wins_list = []
        losses_list = []
        new_list = []
        lost_list = []
        
        for item in items:
            kw = item.get("keyword", "")
            if not kw:
                continue
                
            # Senuto often nests position data in 'statistics'
            stats = item.get("statistics") or {}
            
            pos_now = safe_int(item.get("position") or item.get("position_after") or stats.get("position"))
            pos_before = safe_int(item.get("position_before") or stats.get("position_before"))
            
            # If both are 0 or missing, skip
            if not pos_now and not pos_before:
                continue
                
            # Change can be explicit or calculated
            change = safe_int(item.get("change") or item.get("position_change") or stats.get("position_change"))
            if not change and pos_before and pos_now:
                change = abs(pos_before - pos_now)
                
            entry = {
                "keyword": kw,
                "position_before": pos_before or "—",
                "position_after": pos_now or "—",
                "change": change or 0,
            }
            
            # Categorize
            if pos_before == 0 and pos_now > 0:
                new_list.append(entry)
            elif pos_before > 0 and pos_now == 0:
                lost_list.append(entry)
            elif pos_before > 0 and pos_now > 0:
                if pos_now < pos_before: # Position number is smaller = rank is higher = win
                    wins_list.append(entry)
                elif pos_now > pos_before: # Position number is larger = rank is lower = loss
                    losses_list.append(entry)
                    
        return {
            "wins": sorted(wins_list, key=lambda x: -safe_int(x["change"]))[:max_rows],
            "losses": sorted(losses_list, key=lambda x: -safe_int(x["change"]))[:max_rows],
            "new": sorted(new_list, key=lambda x: safe_int(x["position_after"]))[:max_rows], # Sort new by best position
            "lost": sorted(lost_list, key=lambda x: safe_int(x["position_before"]))[:max_rows], # Sort lost by best previous position
        }

    # Process all items together to categorize them properly
    all_items = wins + losses
    categorized = _normalize_changes(all_items)

    return {
        "changes": {
            "wins_count": safe_int(meta.get("wins_count") or len(categorized["wins"])),
            "losses_count": safe_int(meta.get("losses_count") or len(categorized["losses"])),
            "new_keywords_count": len(categorized["new"]),
            "lost_keywords_count": len(categorized["lost"]),
            "top_wins": categorized["wins"],
            "top_losses": categorized["losses"],
            "new_keywords": categorized["new"],
            "lost_keywords": categorized["lost"],
            "cannibalization": cannibalization[:20],
        }
    }
