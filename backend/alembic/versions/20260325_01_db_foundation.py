"""DB foundation tables for users, settings, and generations.

Revision ID: 20260325_01
Revises:
Create Date: 2026-03-25
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "20260325_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=False)

    op.create_table(
        "user_settings",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("selected_model", sa.String(length=100), nullable=False),
        sa.Column("auto_retry", sa.Boolean(), nullable=False),
        sa.Column("max_retries", sa.Integer(), nullable=False),
        sa.Column("include_source_urls", sa.Boolean(), nullable=False),
        sa.Column("auto_generate_image", sa.Boolean(), nullable=False),
        sa.Column("strict_compliance", sa.Boolean(), nullable=False),
        sa.Column("custom_blocked_words", sa.JSON(), nullable=False),
        sa.Column("encrypted_api_key", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index("ix_user_settings_user_id", "user_settings", ["user_id"], unique=True)

    op.create_table(
        "generations",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("topic", sa.String(length=300), nullable=False),
        sa.Column("audience", sa.String(length=120), nullable=False),
        sa.Column("content_type", sa.String(length=80), nullable=True),
        sa.Column("tone", sa.String(length=80), nullable=True),
        sa.Column("additional_context", sa.Text(), nullable=True),
        sa.Column("linkedin_post", sa.Text(), nullable=True),
        sa.Column("twitter_post", sa.String(length=280), nullable=True),
        sa.Column("image_prompt", sa.Text(), nullable=True),
        sa.Column("compliance_status", sa.String(length=20), nullable=False),
        sa.Column("compliance_notes", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("duration_ms", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_generations_user_id", "generations", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_generations_user_id", table_name="generations")
    op.drop_table("generations")

    op.drop_index("ix_user_settings_user_id", table_name="user_settings")
    op.drop_table("user_settings")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
