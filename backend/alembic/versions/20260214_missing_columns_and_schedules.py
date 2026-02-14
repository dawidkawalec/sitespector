"""Add missing columns to audits and create audit_schedules table

Revision ID: 20260214_missing_cols_schedules
Revises: 20260214_audit_tasks
Create Date: 2026-02-14

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import UUID, JSONB


# revision identifiers, used by Alembic.
revision = "20260214_missing_cols_schedules"
down_revision = "20260214_audit_tasks"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # NOTE: Avoid try/except around DDL. PostgreSQL transactional DDL aborts the whole
    # transaction after the first error, even if Python catches the exception.
    bind = op.get_bind()
    insp = sa.inspect(bind)

    # Add missing columns to audits table (if they don't already exist)
    audits_cols = {c["name"] for c in insp.get_columns("audits")}
    audits_indexes = {i["name"] for i in insp.get_indexes("audits")}

    if "workspace_id" not in audits_cols:
        op.add_column("audits", sa.Column("workspace_id", UUID(as_uuid=True), nullable=True))
    if "ix_audits_workspace_id" not in audits_indexes:
        op.create_index("ix_audits_workspace_id", "audits", ["workspace_id"])

    if "processing_step" not in audits_cols:
        op.add_column("audits", sa.Column("processing_step", sa.String(length=100), nullable=True))

    if "processing_logs" not in audits_cols:
        op.add_column("audits", sa.Column("processing_logs", JSONB, nullable=True))

    if "ai_status" not in audits_cols:
        op.add_column("audits", sa.Column("ai_status", sa.String(length=20), nullable=True))

    # Create schedulefrequency ENUM
    schedulefrequency = postgresql.ENUM('daily', 'weekly', 'monthly', name='schedulefrequency', create_type=False)
    schedulefrequency.create(bind, checkfirst=True)

    # Create audit_schedules table
    existing_tables = set(insp.get_table_names())
    if "audit_schedules" not in existing_tables:
        op.create_table(
            "audit_schedules",
            sa.Column("id", UUID(as_uuid=True), nullable=False),
            sa.Column("user_id", UUID(as_uuid=True), nullable=False),
            sa.Column("workspace_id", UUID(as_uuid=True), nullable=False),
            sa.Column("url", sa.String(length=2048), nullable=False),
            sa.Column("frequency", schedulefrequency, nullable=False),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
            sa.Column("include_competitors", sa.Boolean(), nullable=False, server_default="true"),
            sa.Column("competitors_urls", JSONB, nullable=True),
            sa.Column("last_run_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("next_run_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )

    # Create indexes (if missing)
    if "audit_schedules" in set(insp.get_table_names()):
        schedules_indexes = {i["name"] for i in insp.get_indexes("audit_schedules")}
        if "ix_audit_schedules_user_id" not in schedules_indexes:
            op.create_index("ix_audit_schedules_user_id", "audit_schedules", ["user_id"])
        if "ix_audit_schedules_workspace_id" not in schedules_indexes:
            op.create_index("ix_audit_schedules_workspace_id", "audit_schedules", ["workspace_id"])
        if "ix_audit_schedules_next_run_at" not in schedules_indexes:
            op.create_index("ix_audit_schedules_next_run_at", "audit_schedules", ["next_run_at"])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_audit_schedules_next_run_at', 'audit_schedules')
    op.drop_index('ix_audit_schedules_workspace_id', 'audit_schedules')
    op.drop_index('ix_audit_schedules_user_id', 'audit_schedules')

    # Drop table
    op.drop_table('audit_schedules')

    # Drop enum
    op.execute('DROP TYPE IF EXISTS schedulefrequency')

    # Remove columns from audits (only if they were added by this migration)
    # Note: We use try/except in upgrade, so these might not exist
    try:
        op.drop_column('audits', 'ai_status')
    except Exception:
        pass
    
    try:
        op.drop_column('audits', 'processing_logs')
    except Exception:
        pass
    
    try:
        op.drop_column('audits', 'processing_step')
    except Exception:
        pass
    
    try:
        op.drop_index('ix_audits_workspace_id', 'audits')
        op.drop_column('audits', 'workspace_id')
    except Exception:
        pass
