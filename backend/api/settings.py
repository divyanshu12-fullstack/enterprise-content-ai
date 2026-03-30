from datetime import datetime, timezone
import os
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from api.deps import get_current_user
from db.models import User, UserSettings
from db.security import decrypt_secret, encrypt_secret
from db.session import get_session

router = APIRouter(prefix="/api/settings", tags=["settings"])


class SettingsUpsertRequest(BaseModel):
    selected_model: Literal["gemini-3-flash-preview", "gemini-3.1-flash-lite-preview", "gemini-3.1-pro-preview", "gemini-2.5-flash"] = "gemini-3-flash-preview"
    auto_retry: bool = True
    max_retries: int = Field(default=2, ge=1, le=10)
    include_source_urls: bool = True
    auto_generate_image: bool = True
    strict_compliance: bool = True
    custom_blocked_words: list[str] = Field(default_factory=list)


class ApiKeyUpdateRequest(BaseModel):
    api_key: str = Field(..., max_length=512)


class ApiKeyConnectionTestResponse(BaseModel):
    ok: bool
    detail: str


class SettingsResponse(SettingsUpsertRequest):
    has_api_key: bool = False
    has_default_api_key: bool = False
    has_effective_api_key: bool = False


def _get_or_create_settings(session: Session, user: User) -> UserSettings:
    settings = session.exec(select(UserSettings).where(UserSettings.user_id == user.id)).first()
    if settings:
        return settings

    settings = UserSettings(user_id=user.id)
    try:
        session.add(settings)
        session.commit()
        session.refresh(settings)
    except Exception as exc:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while creating settings",
        ) from exc
    return settings


@router.get("", response_model=SettingsResponse)
def get_settings(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> SettingsResponse:
    settings = _get_or_create_settings(session, current_user)
    has_user_api_key = bool(settings.encrypted_api_key)
    has_default_api_key = bool(os.getenv("GEMINI_API_KEY"))
    return SettingsResponse(
        selected_model=settings.selected_model,
        auto_retry=settings.auto_retry,
        max_retries=settings.max_retries,
        include_source_urls=settings.include_source_urls,
        auto_generate_image=settings.auto_generate_image,
        strict_compliance=settings.strict_compliance,
        custom_blocked_words=settings.custom_blocked_words,
        has_api_key=has_user_api_key,
        has_default_api_key=has_default_api_key,
        has_effective_api_key=(has_user_api_key or has_default_api_key),
    )


@router.put("", response_model=SettingsResponse)
def upsert_settings(
    payload: SettingsUpsertRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> SettingsResponse:
    settings = _get_or_create_settings(session, current_user)

    settings.selected_model = payload.selected_model
    settings.auto_retry = payload.auto_retry
    settings.max_retries = payload.max_retries
    settings.include_source_urls = payload.include_source_urls
    settings.auto_generate_image = payload.auto_generate_image
    settings.strict_compliance = payload.strict_compliance
    settings.custom_blocked_words = payload.custom_blocked_words
    settings.updated_at = datetime.now(timezone.utc)

    try:
        session.add(settings)
        session.commit()
        session.refresh(settings)
    except Exception as exc:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while updating settings",
        ) from exc

    has_user_api_key = bool(settings.encrypted_api_key)
    has_default_api_key = bool(os.getenv("GEMINI_API_KEY"))
    return SettingsResponse(
        **payload.model_dump(),
        has_api_key=has_user_api_key,
        has_default_api_key=has_default_api_key,
        has_effective_api_key=(has_user_api_key or has_default_api_key),
    )


@router.put("/api-key")
def set_api_key(
    payload: ApiKeyUpdateRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> dict[str, str]:
    settings = _get_or_create_settings(session, current_user)
    if payload.api_key.strip():
        settings.encrypted_api_key = encrypt_secret(payload.api_key.strip())
    else:
        settings.encrypted_api_key = None
    settings.updated_at = datetime.now(timezone.utc)
    try:
        session.add(settings)
        session.commit()
    except Exception as exc:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while saving API key",
        ) from exc
    return {"status": "ok"}


@router.post("/test-api-key", response_model=ApiKeyConnectionTestResponse)
def test_api_key(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> ApiKeyConnectionTestResponse:
    settings = _get_or_create_settings(session, current_user)
    if not settings.encrypted_api_key:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No API key configured")

    decrypted = decrypt_secret(settings.encrypted_api_key)
    if len(decrypted) < 10:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Stored API key is invalid")

    return ApiKeyConnectionTestResponse(ok=True, detail="API key is available and decryptable")
