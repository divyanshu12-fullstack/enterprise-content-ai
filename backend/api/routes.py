from __future__ import annotations

import json
import os
import threading
import time
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError
from queue import Empty, Queue

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from pydantic import Field
from pydantic import ValidationError
from starlette.responses import StreamingResponse

from api.deps import get_current_user
from crew.crew_logic import run_content_pipeline
from crew.schemas import FinalContentOutput
from db.models import User, UserSettings
from db.security import decrypt_secret
from db.session import get_session
from sqlmodel import Session, select

router = APIRouter(prefix="/api", tags=["content"])

# Global thread pool to restrict concurrency and prevent OOM
# Requests fail fast when all workers are busy to avoid hidden indefinite queue waits.
GENERATION_MAX_WORKERS = max(1, int(os.getenv("GENERATION_MAX_WORKERS", "2")))
GENERATION_TIMEOUT_SECONDS = max(15, int(os.getenv("GENERATION_TIMEOUT_SECONDS", "300")))
STREAM_STALL_TIMEOUT_SECONDS = max(10, int(os.getenv("STREAM_STALL_TIMEOUT_SECONDS", "60")))
generation_executor = ThreadPoolExecutor(max_workers=GENERATION_MAX_WORKERS)
generation_slots = threading.BoundedSemaphore(value=GENERATION_MAX_WORKERS)


class GenerateRequest(BaseModel):
    topic: str = Field(..., min_length=3, max_length=300)
    audience: str = Field(..., min_length=2, max_length=120)
    content_type: str | None = Field(default=None, max_length=80)
    tone: str | None = Field(default=None, max_length=80)
    additional_context: str | None = Field(default=None, max_length=10000)
    policy_text: str | None = Field(default=None, max_length=50000)
    enforce_twitter_limit: bool = True


class ErrorResponse(BaseModel):
    error: str
    detail: str | list[dict]


class ErrorEnvelope(BaseModel):
    detail: ErrorResponse


class RuntimeSettings(BaseModel):
    model_name: str | None = None
    api_key: str | None = None
    auto_retry: bool = True
    max_retries: int = 1
    include_source_urls: bool = True
    auto_generate_image: bool = True
    strict_compliance: bool = True
    blocked_words: list[str] = Field(default_factory=list)


class ProgressEvent(BaseModel):
    stage: str
    message: str
    retry_attempt: int | None = None
    model_name: str | None = None
    elapsed_ms: int | None = None
    timeout_remaining_s: int | None = None


def _resolve_runtime_settings(
    session: Session | None,
    current_user: User | None,
) -> RuntimeSettings:
    defaults = RuntimeSettings(
        model_name=os.getenv("GEMINI_MODEL", "gemini-3-flash-preview"),
        api_key=os.getenv("GEMINI_API_KEY"),
        auto_retry=True,
        max_retries=1,
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
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to decrypt user API key: {e}")
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
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> FinalContentOutput:
    if not generation_slots.acquire(blocking=False):
        raise HTTPException(
            status_code=503,
            detail={
                "error": "generation_busy",
                "detail": "Generation capacity is full. Please retry shortly.",
            },
        )

    try:
        runtime = _resolve_runtime_settings(session=session, current_user=current_user)
        
        # Define the work function
        def _do_work():
            try:
                return run_content_pipeline(
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
                    enforce_twitter_limit=payload.enforce_twitter_limit,
                )
            finally:
                generation_slots.release()
            
        # Execute it in the strict thread pool to prevent OOM
        future = generation_executor.submit(_do_work)
        result = future.result(timeout=GENERATION_TIMEOUT_SECONDS)
        
        return result
    except HTTPException:
        raise
    except FutureTimeoutError as exc:
        raise HTTPException(
            status_code=504,
            detail={
                "error": "generation_timeout",
                "detail": f"Generation exceeded {GENERATION_TIMEOUT_SECONDS} seconds.",
            },
        ) from exc
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
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> StreamingResponse:
    if not generation_slots.acquire(blocking=False):
        raise HTTPException(
            status_code=503,
            detail={
                "error": "generation_busy",
                "detail": "Generation capacity is full. Please retry shortly.",
            },
        )

    runtime = _resolve_runtime_settings(session=session, current_user=current_user)
    event_queue: Queue[tuple[str, dict]] = Queue()
    started_at = time.monotonic()
    last_progress_at = started_at
    stream_terminated = threading.Event()

    def _safe_put(event_name: str, event_payload: dict) -> None:
        if not stream_terminated.is_set():
            event_queue.put((event_name, event_payload))

    def on_progress(stage: str, message: str) -> None:
        nonlocal last_progress_at
        last_progress_at = time.monotonic()
        _safe_put("progress", ProgressEvent(stage=stage, message=message).model_dump())

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
                enforce_twitter_limit=payload.enforce_twitter_limit,
            )
            _safe_put("result", result.model_dump())
        except ValidationError as exc:
            _safe_put("error", {"error": "validation_error", "detail": exc.errors()})
        except Exception as exc:
            _safe_put("error", {"error": "pipeline_error", "detail": str(exc)})
        finally:
            generation_slots.release()
            _safe_put("done", {})

    # Submit task to global thread pool instead of spawning a raw thread
    try:
        future = generation_executor.submit(run_pipeline)
    except Exception:
        generation_slots.release()
        raise

    def event_stream():
        stall_warning_sent = False
        while True:
            now = time.monotonic()
            elapsed = now - started_at
            if elapsed >= GENERATION_TIMEOUT_SECONDS:
                stream_terminated.set()
                future.cancel()
                timeout_payload = {
                    "error": "generation_timeout",
                    "detail": f"Generation exceeded {GENERATION_TIMEOUT_SECONDS} seconds.",
                }
                yield "event: error\n"
                yield f"data: {json.dumps(timeout_payload)}\n\n"
                yield "event: done\n"
                yield "data: {}\n\n"
                break

            stalled_for = now - last_progress_at
            if stalled_for >= STREAM_STALL_TIMEOUT_SECONDS and not stall_warning_sent:
                timeout_remaining_s = max(0, int(GENERATION_TIMEOUT_SECONDS - elapsed))
                warning = ProgressEvent(
                    stage="stall",
                    message=f"No pipeline progress for {int(stalled_for)}s.",
                    elapsed_ms=int(elapsed * 1000),
                    timeout_remaining_s=timeout_remaining_s,
                ).model_dump()
                yield "event: progress\n"
                yield f"data: {json.dumps(warning)}\n\n"
                stall_warning_sent = True

            try:
                event_name, event_payload = event_queue.get(timeout=0.5)
            except Empty:
                # Keep connection warm while backend work is in progress.
                yield ": keep-alive\n\n"
                continue

            if event_name == "progress":
                stall_warning_sent = False

            yield f"event: {event_name}\n"
            yield f"data: {json.dumps(event_payload)}\n\n"

            if event_name == "done":
                stream_terminated.set()
                break

    return StreamingResponse(event_stream(), media_type="text/event-stream")
