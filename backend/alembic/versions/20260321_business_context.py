"""Add business_contexts table and audit FK/mode columns.

Revision ID: 20260321_business_context
Revises: 20260318_credit_system
Create Date: 2026-03-21

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID, JSONB


revision = "20260321_business_context"
down_revision = "20260318_credit_system"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing_tables = insp.get_table_names()

    # 1. Create business_contexts table
    if "business_contexts" not in existing_tables:
        op.create_table(
            "business_contexts",
            sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column("workspace_id", UUID(as_uuid=True), nullable=False),
            sa.Column("project_id", UUID(as_uuid=True), nullable=True),
            sa.Column("business_type", sa.String(100), nullable=True),
            sa.Column("industry", sa.String(200), nullable=True),
            sa.Column("target_audience", sa.Text(), nullable=True),
            sa.Column("geographic_focus", sa.String(200), nullable=True),
            sa.Column("business_goals", JSONB, nullable=True),
            sa.Column("priorities", JSONB, nullable=True),
            sa.Column("key_products_services", JSONB, nullable=True),
            sa.Column("competitors_context", sa.Text(), nullable=True),
            sa.Column("current_challenges", sa.Text(), nullable=True),
            sa.Column("budget_range", sa.String(50), nullable=True),
            sa.Column("team_capabilities", sa.String(50), nullable=True),
            sa.Column("smart_form_questions", JSONB, nullable=True),
            sa.Column("source", sa.String(30), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_business_contexts_workspace_id", "business_contexts", ["workspace_id"])
        op.create_index("ix_business_contexts_project_id", "business_contexts", ["project_id"])

    # 2. Add new columns to audits table
    existing_columns = [c["name"] for c in insp.get_columns("audits")]

    if "business_context_id" not in existing_columns:
        op.add_column(
            "audits",
            sa.Column("business_context_id", UUID(as_uuid=True), nullable=True),
        )
        op.create_foreign_key(
            "fk_audits_business_context_id",
            "audits",
            "business_contexts",
            ["business_context_id"],
            ["id"],
            ondelete="SET NULL",
        )

    if "mode" not in existing_columns:
        op.add_column(
            "audits",
            sa.Column("mode", sa.String(20), nullable=False, server_default="professional"),
        )

    # 3. Add awaiting_context to audit status enum
    # PostgreSQL enum type needs to be extended
    op.execute("ALTER TYPE auditstatus ADD VALUE IF NOT EXISTS 'awaiting_context'")


def downgrade() -> None:
    # Remove audit columns
    op.drop_constraint("fk_audits_business_context_id", "audits", type_="foreignkey")
    op.drop_column("audits", "business_context_id")
    op.drop_column("audits", "mode")

    # Drop table
    op.drop_index("ix_business_contexts_project_id", table_name="business_contexts")
    op.drop_index("ix_business_contexts_workspace_id", table_name="business_contexts")
    op.drop_table("business_contexts")
