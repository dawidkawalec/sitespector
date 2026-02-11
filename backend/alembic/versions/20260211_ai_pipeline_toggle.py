"""add run_ai_pipeline toggle

Revision ID: 20260211_ai_toggle
Revises: 20260211_senuto
Create Date: 2026-02-11 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260211_ai_toggle'
down_revision = '20260211_senuto'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('audits', sa.Column('run_ai_pipeline', sa.Boolean(), nullable=False, server_default='true'))


def downgrade() -> None:
    op.drop_column('audits', 'run_ai_pipeline')
