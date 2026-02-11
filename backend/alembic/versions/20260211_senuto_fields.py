"""senuto fields

Revision ID: 20260211_senuto
Revises: 20260211_0100
Create Date: 2026-02-11 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260211_senuto'
down_revision = '20260211_0100_add_public_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('audits', sa.Column('senuto_country_id', sa.Integer(), nullable=True, server_default='200'))
    op.add_column('audits', sa.Column('senuto_fetch_mode', sa.String(length=20), nullable=True, server_default='subdomain'))


def downgrade() -> None:
    op.drop_column('audits', 'senuto_fetch_mode')
    op.drop_column('audits', 'senuto_country_id')
