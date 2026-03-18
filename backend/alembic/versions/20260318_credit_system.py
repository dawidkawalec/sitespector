"""Add credit_balances and credit_transactions tables.

Revision ID: 20260318_credit_system
Revises: 20260217_add_project_id
Create Date: 2026-03-18

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID, JSONB


revision = "20260318_credit_system"
down_revision = "20260217_add_project_id"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing_tables = insp.get_table_names()

    if "credit_balances" not in existing_tables:
        op.create_table(
            "credit_balances",
            sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column("workspace_id", UUID(as_uuid=True), nullable=False, unique=True),
            sa.Column("subscription_credits", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("purchased_credits", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        )
        op.create_index("ix_credit_balances_workspace_id", "credit_balances", ["workspace_id"], unique=True)

    if "credit_transactions" not in existing_tables:
        op.create_table(
            "credit_transactions",
            sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column("workspace_id", UUID(as_uuid=True), nullable=False),
            sa.Column("user_id", UUID(as_uuid=True), nullable=False),
            sa.Column("type", sa.String(30), nullable=False),
            sa.Column("amount", sa.Integer(), nullable=False),
            sa.Column("balance_after", sa.Integer(), nullable=False),
            sa.Column("metadata", JSONB, nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_credit_transactions_workspace_id", "credit_transactions", ["workspace_id"])
        op.create_index("ix_credit_transactions_type", "credit_transactions", ["type"])
        op.create_index(
            "ix_credit_transactions_workspace_created",
            "credit_transactions",
            ["workspace_id", sa.text("created_at DESC")],
        )


def downgrade() -> None:
    op.drop_table("credit_transactions")
    op.drop_table("credit_balances")
