from __future__ import annotations

import json
import os
import threading
from queue import Empty, Queue

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from pydantic import Field
from pydantic import ValidationError
from starlette.responses import StreamingResponse

from api.deps import get_current_user_optional
from crew.crew_logic import run_content_pipeline
from crew.schemas import FinalContentOutput
from db.models import User, UserSettings
from db.security import decrypt_secret
from db.session import get_session
from sqlmodel import Session, select

router = APIRouter(prefix="/api", tags=["content"])


class GenerateRequest(BaseModel):
    topic: str = Field(..., min_length=3, max_length=300)
    audience: str = Field(..., min_length=2, max_length=120)
    content_type: str | None = Field(default=None, max_length=80)
    tone: str | None = Field(default=None, max_length=80)
    additional_context: str | None = None
    policy_text: str | None = None


class ErrorResponse(BaseModel):
    error: str
    detail: str | list[dict]


class ErrorEnvelope(BaseModel):
    detail: ErrorResponse


class RuntimeSettings(BaseModel):
    model_name: str | None = None
    api_key: str | None = None
    auto_retry: bool = True
    max_retries: int = 2
    include_source_urls: bool = True
    auto_generate_image: bool = True
    strict_compliance: bool = True
    blocked_words: list[str] = Field(default_factory=list)


class ProgressEvent(BaseModel):
    stage: str
    message: str


def _resolve_runtime_settings(
    session: Session | None,
    current_user: User | None,
) -> RuntimeSettings:
    defaults = RuntimeSettings(
        model_name=os.getenv("GEMINI_MODEL", "gemini-3.1-flash"),
        api_key=os.getenv("GEMINI_API_KEY"),
        auto_retry=True,
        max_retries=2,
        include_source_urls=True,
        auto_generate_image=True,
        strict_compliance=True,
        blocked_words=[],
    )
    if not isinstance(session, Session) or not isinstance(current_user, User):
        return defaults

    settings = session.exec(select(UserSettings).where(UserSettings.user_id == current_user.id)).first()
    if not settings:
        return defaults

    api_key = defaults.api_key
    if settings.encrypted_api_key:
        try:
            api_key = decrypt_secret(settings.encrypted_api_key)
        except Exception:
            api_key = defaults.api_key

    return RuntimeSettings(
        model_name=settings.selected_model or defaults.model_name,
        api_key=api_key,
        auto_retry=settings.auto_retry,
        max_retries=settings.max_retries,
        include_source_urls=settings.include_source_urls,
        auto_generate_image=settings.auto_generate_image,
        strict_compliance=settings.strict_compliance,
        blocked_words=settings.custom_blocked_words or [],
    )


@router.post(
    "/generate",
    response_model=FinalContentOutput,
    responses={
        422: {"model": ErrorEnvelope},
        500: {"model": ErrorEnvelope},
    },
)
def generate_content(
    payload: GenerateRequest,
    current_user: User | None = Depends(get_current_user_optional),
    session: Session = Depends(get_session),
) -> FinalContentOutput:
    try:
        runtime = _resolve_runtime_settings(session=session, current_user=current_user)
        result = run_content_pipeline(
            topic=payload.topic,
            audience=payload.audience,
            content_type=payload.content_type,
            tone=payload.tone,
            additional_context=payload.additional_context,
            policy_text=payload.policy_text,
            model_name=runtime.model_name,
            api_key=runtime.api_key,
            auto_retry=runtime.auto_retry,
            max_retries=runtime.max_retries,
            include_source_urls=runtime.include_source_urls,
            auto_generate_image=runtime.auto_generate_image,
            strict_compliance=runtime.strict_compliance,
            blocked_words=runtime.blocked_words,
        )
        return result
    except ValidationError as exc:
        raise HTTPException(
            status_code=422,
            detail={"error": "validation_error", "detail": exc.errors()},
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={"error": "pipeline_error", "detail": str(exc)},
        ) from exc


@router.post("/generate/stream")
def generate_content_stream(
    payload: GenerateRequest,
    current_user: User | None = Depends(get_current_user_optional),
    session: Session = Depends(get_session),
) -> StreamingResponse:
    runtime = _resolve_runtime_settings(session=session, current_user=current_user)
    event_queue: Queue[tuple[str, dict]] = Queue()

    def on_progress(stage: str, message: str) -> None:
        event_queue.put(("progress", ProgressEvent(stage=stage, message=message).model_dump()))

    def run_pipeline() -> None:
        try:
            result = run_content_pipeline(
                topic=payload.topic,
                audience=payload.audience,
                content_type=payload.content_type,
                tone=payload.tone,
                additional_context=payload.additional_context,
                policy_text=payload.policy_text,
                model_name=runtime.model_name,
                api_key=runtime.api_key,
                auto_retry=runtime.auto_retry,
                max_retries=runtime.max_retries,
                include_source_urls=runtime.include_source_urls,
                auto_generate_image=runtime.auto_generate_image,
                strict_compliance=runtime.strict_compliance,
                blocked_words=runtime.blocked_words,
                progress_callback=on_progress,
            )
            event_queue.put(("result", result.model_dump()))
        except ValidationError as exc:
            event_queue.put(("error", {"error": "validation_error", "detail": exc.errors()}))
        except Exception as exc:
            event_queue.put(("error", {"error": "pipeline_error", "detail": str(exc)}))
        finally:
            event_queue.put(("done", {}))

    worker = threading.Thread(target=run_pipeline, daemon=True)
    worker.start()

    def event_stream():
        while True:
            try:
                event_name, event_payload = event_queue.get(timeout=0.5)
            except Empty:
                # Keep connection warm while backend work is in progress.
                yield ": keep-alive\n\n"
                continue

            yield f"event: {event_name}\n"
            yield f"data: {json.dumps(event_payload)}\n\n"

            if event_name == "done":
                break

    return StreamingResponse(event_stream(), media_type="text/event-stream")
