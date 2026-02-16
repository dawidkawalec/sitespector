"""Add chat_message_feedback table for thumbs up/down.

Revision ID: 20260216_chat_feedback
Revises: 20260216_chat_attachments
Create Date: 2026-02-16
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision = "20260216_chat_feedback"
down_revision = "20260216_chat_attachments"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "chat_message_feedback",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "message_id",
            UUID(as_uuid=True),
            sa.ForeignKey("chat_messages.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),  # +1 or -1
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("message_id", "user_id", name="uq_chat_feedback_message_user"),
    )
    op.create_index("ix_chat_feedback_message_id", "chat_message_feedback", ["message_id"])
    op.create_index("ix_chat_feedback_user_id", "chat_message_feedback", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_chat_feedback_user_id", table_name="chat_message_feedback")
    op.drop_index("ix_chat_feedback_message_id", table_name="chat_message_feedback")
    op.drop_table("chat_message_feedback")

