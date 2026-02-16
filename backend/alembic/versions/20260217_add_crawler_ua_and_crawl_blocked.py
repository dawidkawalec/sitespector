"""Add crawler_user_agent and crawl_blocked to audits.

Revision ID: 20260217_crawler_ua_blocked
Revises: 20260216_add_rag_indexed_at
Create Date: 2026-02-17

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260217_crawler_ua_blocked"
down_revision = "20260216_add_rag_indexed_at"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "audits",
        sa.Column("crawler_user_agent", sa.String(500), nullable=True),
    )
    op.add_column(
        "audits",
        sa.Column("crawl_blocked", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_column("audits", "crawl_blocked")
    op.drop_column("audits", "crawler_user_agent")
