"""create calls table (or add room_name if table already exists)

Revision ID: c9d2a1b0
Revises: 36111673e962
Create Date: 2026-05-01 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c9d2a1b0"
down_revision: Union[str, Sequence[str], None] = "36111673e962"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "calls" not in inspector.get_table_names():
        op.create_table(
            "calls",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("sender_id", sa.Integer(), nullable=False),
            sa.Column("receiver_id", sa.Integer(), nullable=False),
            sa.Column("room_name", sa.String(length=512), nullable=True),
            sa.Column("room_url", sa.String(length=2000), nullable=False),
            sa.Column("sender_token", sa.String(length=2000), nullable=True),
            sa.Column("receiver_token", sa.String(length=2000), nullable=True),
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
            sa.ForeignKeyConstraint(["receiver_id"], ["users.id"]),
            sa.ForeignKeyConstraint(["sender_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(
            op.f("ix_calls_receiver_id"), "calls", ["receiver_id"], unique=False
        )
        op.create_index(
            op.f("ix_calls_sender_id"), "calls", ["sender_id"], unique=False
        )
        return

    cols = {c["name"] for c in inspector.get_columns("calls")}
    if "room_name" not in cols:
        op.add_column(
            "calls",
            sa.Column("room_name", sa.String(length=512), nullable=True),
        )
    if "sender_token" in cols:
        op.alter_column("calls", "sender_token", existing_type=sa.String(length=2000), nullable=True)
    if "receiver_token" in cols:
        op.alter_column("calls", "receiver_token", existing_type=sa.String(length=2000), nullable=True)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "calls" not in inspector.get_table_names():
        return
    cols = {c["name"] for c in inspector.get_columns("calls")}
    if "room_name" in cols:
        op.drop_column("calls", "room_name")
