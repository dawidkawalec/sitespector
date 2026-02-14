"""Make audits.user_id nullable for workspace audits

Revision ID: 20260214_audits_user_id_nullable
Revises: 20260211_ai_toggle
Create Date: 2026-02-14

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260214_audits_user_id_nullable"
down_revision = "20260211_ai_toggle"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Workspace-based audits intentionally set user_id=None.
    op.alter_column(
        "audits",
        "user_id",
        existing_type=sa.UUID(),
        nullable=True,
    )


def downgrade() -> None:
    # Reverting would break workspace-based audits; keep for completeness only.
    op.alter_column(
        "audits",
        "user_id",
        existing_type=sa.UUID(),
        nullable=False,
    )

