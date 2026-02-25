"""Data extractor for Execution Plan section."""

from typing import Any, Dict, List
from collections import defaultdict


def extract(
    audit_data: Dict[str, Any],
    tasks: List[Dict],
    max_rows: int = 30,
    extended: bool = False,
) -> Dict[str, Any]:
    # Limit tasks
    limited_tasks = tasks[:max_rows] if not extended else tasks

    # Group by module
    tasks_by_module: Dict[str, List[Dict]] = defaultdict(list)
    for task in limited_tasks:
        module = task.get("module") or "seo"
        tasks_by_module[module].append(task)

    # Stats
    total = len(limited_tasks)
    critical = sum(1 for t in limited_tasks if t.get("priority") == "critical")
    high = sum(1 for t in limited_tasks if t.get("priority") == "high")
    quick_wins = sum(1 for t in limited_tasks if t.get("is_quick_win"))

    return {
        "tasks_by_module": dict(tasks_by_module),
        "ep_stats": {
            "total": total,
            "critical": critical,
            "high": high,
            "quick_wins": quick_wins,
        },
        "extended": extended,
    }
