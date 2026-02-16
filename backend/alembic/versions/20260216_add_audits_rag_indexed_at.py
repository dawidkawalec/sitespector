"""Add audits.rag_indexed_at for RAG indexing tracking.

Revision ID: 20260216_add_audits_rag_indexed_at
Revises: 20260216_chat_feedback
Create Date: 2026-02-16
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260216_add_audits_rag_indexed_at"
down_revision = "20260216_chat_feedback"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("audits", sa.Column("rag_indexed_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_audits_rag_indexed_at", "audits", ["rag_indexed_at"])


def downgrade() -> None:
    op.drop_index("ix_audits_rag_indexed_at", table_name="audits")
    op.drop_column("audits", "rag_indexed_at")

