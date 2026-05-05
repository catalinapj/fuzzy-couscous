"""create calls table

Revision ID: e4f9c2a1b7d3
Revises: 36111673e962
Create Date: 2026-05-05 09:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e4f9c2a1b7d3"
down_revision: Union[str, Sequence[str], None] = "36111673e962"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "calls",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("sender_id", sa.Integer(), nullable=False),
        sa.Column("receiver_id", sa.Integer(), nullable=False),
        sa.Column("room_name", sa.String(length=512), nullable=True),
        sa.Column("room_url", sa.String(length=2000), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(["sender_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["receiver_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_calls_sender_id"), "calls", ["sender_id"], unique=False)
    op.create_index(op.f("ix_calls_receiver_id"), "calls", ["receiver_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_calls_receiver_id"), table_name="calls")
    op.drop_index(op.f("ix_calls_sender_id"), table_name="calls")
    op.drop_table("calls")
