"""Fix competitors ON DELETE CASCADE

Revision ID: 20260214_fix_competitors_cascade
Revises: 20260214_missing_cols_schedules
Create Date: 2026-02-14

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260214_fix_competitors_cascade"
down_revision = "20260214_missing_cols_schedules"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop existing foreign key constraint
    op.drop_constraint('competitors_audit_id_fkey', 'competitors', type_='foreignkey')
    
    # Recreate with ON DELETE CASCADE
    op.create_foreign_key(
        'competitors_audit_id_fkey',
        'competitors',
        'audits',
        ['audit_id'],
        ['id'],
        ondelete='CASCADE'
    )


def downgrade() -> None:
    # Drop CASCADE foreign key
    op.drop_constraint('competitors_audit_id_fkey', 'competitors', type_='foreignkey')
    
    # Recreate without CASCADE (original state)
    op.create_foreign_key(
        'competitors_audit_id_fkey',
        'competitors',
        'audits',
        ['audit_id'],
        ['id']
    )
