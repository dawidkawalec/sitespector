"""Update agent_types tools_config with analysis sections (roadmap, cross_tool, executive_summary).

Revision ID: 20260215_update_agent_tools
Revises: 20260215_chat_tables
Create Date: 2026-02-15

"""

from __future__ import annotations

import json
from typing import Any, Dict, List

from alembic import op

revision = "20260215_update_agent_tools"
down_revision = "20260215_chat_tables"
branch_labels = None
depends_on = None


AGENT_TOOLS_UPDATE: Dict[str, List[str]] = {
    "seo-expert": [
        "crawl_overview",
        "lighthouse_desktop",
        "lighthouse_mobile",
        "content_analysis",
        "senuto_visibility",
        "ai_contexts_seo",
        "quick_wins",
        "executive_summary",
        "roadmap",
        "cross_tool",
    ],
    "linking-expert": [
        "links_internal",
        "senuto_backlinks",
        "crawl_overview",
        "ai_contexts_links",
        "quick_wins",
        "roadmap",
    ],
    "seo-copywriter": [
        "content_analysis",
        "senuto_visibility",
        "links_internal",
        "ai_contexts_content",
        "quick_wins",
        "roadmap",
    ],
    "performance-expert": [
        "lighthouse_desktop",
        "lighthouse_mobile",
        "performance_analysis",
        "ai_contexts_performance",
        "quick_wins",
        "roadmap",
        "cross_tool",
    ],
    "aio-strategist": [
        "senuto_ai_overviews",
        "senuto_visibility",
        "ai_contexts_ai_overviews",
        "quick_wins",
        "roadmap",
        "cross_tool",
        "executive_summary",
    ],
}


def upgrade() -> None:
    for slug, tools in AGENT_TOOLS_UPDATE.items():
        tools_json = json.dumps(tools)
        op.execute(
            f"UPDATE agent_types SET tools_config = '{tools_json}'::jsonb WHERE slug = '{slug}'"
        )


def downgrade() -> None:
    pass
