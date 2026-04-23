"""add timestamps to messages

Revision ID: add_timestamps_to_messages
Revises: a1981be5
Create Date: 2026-04-23 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'add_timestamps_to_messages'
down_revision = 'a1981be5'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('messages', sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True))
    op.add_column('messages', sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=True))


def downgrade():
    op.drop_column('messages', 'updated_at')
    op.drop_column('messages', 'created_at')
