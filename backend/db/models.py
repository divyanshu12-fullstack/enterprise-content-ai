from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, JSON, Text
from sqlmodel import Field, SQLModel


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(index=True, unique=True, max_length=255)
    password_hash: str = Field(max_length=255)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)


class UserSettings(SQLModel, table=True):
    __tablename__ = "user_settings"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", unique=True, index=True)

    selected_model: str = Field(default="gemini-3.1-flash", max_length=100)
    auto_retry: bool = Field(default=True)
    max_retries: int = Field(default=2, ge=1, le=10)
    include_source_urls: bool = Field(default=True)
    auto_generate_image: bool = Field(default=True)
    strict_compliance: bool = Field(default=True)

    notifications_email: bool = Field(default=True)
    notifications_push: bool = Field(default=False)
    notifications_slack: bool = Field(default=False)
    notifications_on_approval: bool = Field(default=True)
    notifications_on_rejection: bool = Field(default=True)
    notifications_weekly_report: bool = Field(default=True)

    custom_blocked_words: list[str] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
    encrypted_api_key: str | None = Field(default=None, sa_column=Column(Text, nullable=True))

    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)


class Generation(SQLModel, table=True):
    __tablename__ = "generations"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)

    topic: str = Field(max_length=300)
    audience: str = Field(max_length=120)
    content_type: str | None = Field(default=None, max_length=80)
    tone: str | None = Field(default=None, max_length=80)
    additional_context: str | None = Field(default=None, sa_column=Column(Text, nullable=True))

    linkedin_post: str | None = Field(default=None, sa_column=Column(Text, nullable=True))
    twitter_post: str | None = Field(default=None, max_length=280)
    image_prompt: str | None = Field(default=None, sa_column=Column(Text, nullable=True))
    compliance_status: str = Field(default="PENDING", max_length=20)
    compliance_notes: str | None = Field(default=None, sa_column=Column(Text, nullable=True))

    status: str = Field(default="PENDING", max_length=20)
    error_message: str | None = Field(default=None, sa_column=Column(Text, nullable=True))
    duration_ms: int | None = Field(default=None)

    created_at: datetime = Field(default_factory=utcnow)
    completed_at: datetime | None = Field(default=None)
