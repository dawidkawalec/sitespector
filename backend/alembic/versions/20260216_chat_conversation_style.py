"""Add verbosity and tone settings to chat_conversations.

Revision ID: 20260216_chat_conversation_style
Revises: 20260216_agent_sort_order
Create Date: 2026-02-16
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260216_chat_conversation_style"
down_revision = "20260216_agent_sort_order"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "chat_conversations",
        sa.Column("verbosity", sa.String(length=20), nullable=False, server_default="balanced"),
    )
    op.add_column(
        "chat_conversations",
        sa.Column("tone", sa.String(length=20), nullable=False, server_default="professional"),
    )


def downgrade() -> None:
    op.drop_column("chat_conversations", "tone")
    op.drop_column("chat_conversations", "verbosity")

