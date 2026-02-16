"""Add project_id to audits and audit_schedules.

Revision ID: 20260217_add_project_id
Revises: 20260217_crawler_ua_blocked
Create Date: 2026-02-17

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID


revision = "20260217_add_project_id"
down_revision = "20260217_crawler_ua_blocked"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    audits_cols = {c["name"] for c in insp.get_columns("audits")}
    audits_indexes = {i["name"] for i in insp.get_indexes("audits")}

    if "project_id" not in audits_cols:
        op.add_column(
            "audits",
            sa.Column("project_id", UUID(as_uuid=True), nullable=True),
        )
    if "ix_audits_project_id" not in audits_indexes:
        op.create_index("ix_audits_project_id", "audits", ["project_id"], unique=False)

    if "audit_schedules" in insp.get_table_names():
        sched_cols = {c["name"] for c in insp.get_columns("audit_schedules")}
        sched_indexes = {i["name"] for i in insp.get_indexes("audit_schedules")}
        if "project_id" not in sched_cols:
            op.add_column(
                "audit_schedules",
                sa.Column("project_id", UUID(as_uuid=True), nullable=True),
            )
        if "ix_audit_schedules_project_id" not in sched_indexes:
            op.create_index(
                "ix_audit_schedules_project_id",
                "audit_schedules",
                ["project_id"],
                unique=False,
            )


def downgrade() -> None:
    op.drop_index("ix_audits_project_id", table_name="audits")
    op.drop_column("audits", "project_id")

    op.drop_index("ix_audit_schedules_project_id", table_name="audit_schedules")
    op.drop_column("audit_schedules", "project_id")
