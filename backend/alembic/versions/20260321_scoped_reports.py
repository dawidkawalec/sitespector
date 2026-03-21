"""Add scoped_reports table.

Revision ID: 20260321_scoped_reports
Revises: 20260321_business_context
Create Date: 2026-03-21

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID, JSONB


revision = "20260321_scoped_reports"
down_revision = "20260321_business_context"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing_tables = insp.get_table_names()

    if "scoped_reports" not in existing_tables:
        op.create_table(
            "scoped_reports",
            sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column("audit_id", UUID(as_uuid=True), sa.ForeignKey("audits.id", ondelete="CASCADE"), nullable=False),
            sa.Column("scope_type", sa.String(50), nullable=False),
            sa.Column("scope_label", sa.String(200), nullable=False),
            sa.Column("scope_filter", JSONB, nullable=False),
            sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
            sa.Column("error_message", sa.Text(), nullable=True),
            sa.Column("results", JSONB, nullable=True),
            sa.Column("credits_used", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        )
        op.create_index("ix_scoped_reports_audit_id", "scoped_reports", ["audit_id"])
        op.create_index("ix_scoped_reports_status", "scoped_reports", ["status"])


def downgrade() -> None:
    op.drop_index("ix_scoped_reports_status", table_name="scoped_reports")
    op.drop_index("ix_scoped_reports_audit_id", table_name="scoped_reports")
    op.drop_table("scoped_reports")
