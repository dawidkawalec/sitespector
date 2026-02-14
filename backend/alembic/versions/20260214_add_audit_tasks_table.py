"""Add audit_tasks table and execution plan fields

Revision ID: 20260214_audit_tasks
Revises: 20260214_audits_user_id_nullable
Create Date: 2026-02-14

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import UUID, JSONB


# revision identifiers, used by Alembic.
revision = "20260214_audit_tasks"
down_revision = "20260214_audits_user_id_nullable"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add execution plan fields to audits table
    op.add_column('audits', sa.Column('run_execution_plan', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('audits', sa.Column('execution_plan_status', sa.String(length=20), nullable=True))

    # Create enums once (idempotent) and reuse the same objects in table columns.
    # Avoids DuplicateObjectError when SQLAlchemy also tries to create types on table create.
    taskstatus = postgresql.ENUM('pending', 'done', name='taskstatus')
    taskpriority = postgresql.ENUM('critical', 'high', 'medium', 'low', name='taskpriority')
    bind = op.get_bind()
    taskstatus.create(bind, checkfirst=True)
    taskpriority.create(bind, checkfirst=True)

    # Create audit_tasks table
    op.create_table(
        'audit_tasks',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('audit_id', UUID(as_uuid=True), nullable=False),
        sa.Column('module', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('priority', taskpriority, nullable=False),
        sa.Column('impact', sa.String(length=20), nullable=False),
        sa.Column('effort', sa.String(length=20), nullable=False),
        sa.Column('is_quick_win', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('fix_data', JSONB, nullable=True),
        sa.Column('status', taskstatus, nullable=False, server_default='pending'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('source', sa.String(length=50), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['audit_id'], ['audits.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index('ix_audit_tasks_audit_id', 'audit_tasks', ['audit_id'])
    op.create_index('ix_audit_tasks_module', 'audit_tasks', ['module'])
    op.create_index('ix_audit_tasks_priority', 'audit_tasks', ['priority'])
    op.create_index('ix_audit_tasks_is_quick_win', 'audit_tasks', ['is_quick_win'])
    op.create_index('ix_audit_tasks_status', 'audit_tasks', ['status'])
    op.create_index('ix_audit_tasks_created_at', 'audit_tasks', ['created_at'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_audit_tasks_created_at', 'audit_tasks')
    op.drop_index('ix_audit_tasks_status', 'audit_tasks')
    op.drop_index('ix_audit_tasks_is_quick_win', 'audit_tasks')
    op.drop_index('ix_audit_tasks_priority', 'audit_tasks')
    op.drop_index('ix_audit_tasks_module', 'audit_tasks')
    op.drop_index('ix_audit_tasks_audit_id', 'audit_tasks')

    # Drop table
    op.drop_table('audit_tasks')

    # Drop enums
    op.execute('DROP TYPE IF EXISTS taskpriority')
    op.execute('DROP TYPE IF EXISTS taskstatus')

    # Remove execution plan fields from audits
    op.drop_column('audits', 'execution_plan_status')
    op.drop_column('audits', 'run_execution_plan')
