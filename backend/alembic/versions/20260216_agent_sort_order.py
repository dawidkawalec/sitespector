"""Add sort_order to agent_types and seed default ordering.

Revision ID: 20260216_agent_sort_order
Revises: 20260215_update_agent_tools
Create Date: 2026-02-16
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260216_agent_sort_order"
down_revision = "20260215_update_agent_tools"
branch_labels = None
depends_on = None


AGENT_SORT_ORDERS: dict[str, int] = {
    # Requested default ordering:
    # 1) ekspert SEO
    # 2) ekspert wydajnosci
    # 3) ekspert linkowania
    # 4) copywriter
    "seo-expert": 1,
    "performance-expert": 2,
    "linking-expert": 3,
    "seo-copywriter": 4,
    # Keep the remaining system agent at the end by default
    "aio-strategist": 5,
}


def upgrade() -> None:
    op.add_column(
        "agent_types",
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
    )

    for slug, order in AGENT_SORT_ORDERS.items():
        op.execute(
            sa.text("UPDATE agent_types SET sort_order = :order WHERE slug = :slug").bindparams(
                order=order, slug=slug
            )
        )


def downgrade() -> None:
    op.drop_column("agent_types", "sort_order")

