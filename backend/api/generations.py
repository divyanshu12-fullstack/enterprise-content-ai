import uuid
from datetime import datetime, timezone
from statistics import median

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select
from sqlalchemy import func

from api.deps import get_current_user
from db.models import Generation, User
from db.session import get_session

router = APIRouter(prefix="/api/generations", tags=["generations"])


class GenerationCreateRequest(BaseModel):
    topic: str = Field(..., min_length=3, max_length=300)
    audience: str = Field(..., min_length=2, max_length=120)
    content_type: str | None = Field(default=None, max_length=80)
    tone: str | None = Field(default=None, max_length=80)
    additional_context: str | None = None

    linkedin_post: str | None = None
    twitter_post: str | None = Field(default=None, max_length=280)
    image_prompt: str | None = None
    compliance_status: str = Field(default="PENDING", max_length=20)
    compliance_notes: str | None = None

    status: str = Field(default="PENDING", max_length=20)
    error_message: str | None = None
    duration_ms: int | None = None


class GenerationResponse(BaseModel):
    id: str
    topic: str
    audience: str
    content_type: str | None
    tone: str | None
    additional_context: str | None
    linkedin_post: str | None
    twitter_post: str | None
    image_prompt: str | None
    compliance_status: str
    compliance_notes: str | None
    status: str
    error_message: str | None
    duration_ms: int | None
    created_at: datetime
    completed_at: datetime | None


class GenerationListResponse(BaseModel):
    items: list[GenerationResponse]
    total: int


class GenerationActionRequest(BaseModel):
    notes: str | None = None


class GenerationMetricsResponse(BaseModel):
    total_runs: int
    approved_runs: int
    rejected_runs: int
    pass_rate: float
    rejection_rate: float
    median_duration_ms: float | None



def _to_response(record: Generation) -> GenerationResponse:
    return GenerationResponse(
        id=str(record.id),
        topic=record.topic,
        audience=record.audience,
        content_type=record.content_type,
        tone=record.tone,
        additional_context=record.additional_context,
        linkedin_post=record.linkedin_post,
        twitter_post=record.twitter_post,
        image_prompt=record.image_prompt,
        compliance_status=record.compliance_status,
        compliance_notes=record.compliance_notes,
        status=record.status,
        error_message=record.error_message,
        duration_ms=record.duration_ms,
        created_at=record.created_at,
        completed_at=record.completed_at,
    )


def _terminal_status(status: str) -> bool:
    return status.upper() in {"COMPLETED", "SUCCESS", "FAILED", "APPROVED", "REJECTED", "PUBLISHED"}


def _duration_ms(created_at: datetime, completed_at: datetime) -> int:
    elapsed = (completed_at - created_at).total_seconds() * 1000
    return int(max(0, round(elapsed)))


@router.post("", response_model=GenerationResponse)
def create_generation(
    payload: GenerationCreateRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> GenerationResponse:
    record = Generation(user_id=current_user.id, **payload.model_dump())
    if _terminal_status(record.status):
        record.completed_at = datetime.now(timezone.utc)
    if record.duration_ms is None and record.completed_at is not None:
        record.duration_ms = _duration_ms(record.created_at, record.completed_at)

    try:
        session.add(record)
        session.commit()
        session.refresh(record)
    except Exception as exc:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while saving generation record",
        ) from exc
    return _to_response(record)


@router.get("", response_model=GenerationListResponse)
def list_generations(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
    status: str | None = Query(default=None),
    search: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> GenerationListResponse:
    statement = select(Generation).where(Generation.user_id == current_user.id)
    if status:
        statement = statement.where(func.lower(Generation.status) == status.lower())
    if search:
        like = f"%{search}%"
        statement = statement.where((Generation.topic.ilike(like)) | (Generation.audience.ilike(like)))

    ordered = statement.order_by(Generation.created_at.desc())
    rows = session.exec(ordered.offset(offset).limit(limit)).all()
    total = session.exec(select(func.count()).select_from(statement.subquery())).one()
    return GenerationListResponse(items=[_to_response(r) for r in rows], total=int(total))


@router.get("/metrics", response_model=GenerationMetricsResponse)
def generation_metrics(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> GenerationMetricsResponse:
    total_runs = session.exec(select(func.count(Generation.id)).where(Generation.user_id == current_user.id)).one()
    
    approved_runs = session.exec(
        select(func.count(Generation.id)).where(
            Generation.user_id == current_user.id,
            func.lower(Generation.compliance_status) == "approved"
        )
    ).one()
    
    rejected_runs = session.exec(
        select(func.count(Generation.id)).where(
            Generation.user_id == current_user.id,
            func.lower(Generation.compliance_status) == "rejected"
        )
    ).one()

    durations = session.exec(
        select(Generation.duration_ms).where(
            Generation.user_id == current_user.id,
            Generation.duration_ms.isnot(None),
            Generation.duration_ms >= 0
        )
    ).all()

    pass_rate = (approved_runs / total_runs) * 100 if total_runs else 0.0
    rejection_rate = (rejected_runs / total_runs) * 100 if total_runs else 0.0
    median_duration_ms = float(median(durations)) if durations else None

    return GenerationMetricsResponse(
        total_runs=total_runs,
        approved_runs=approved_runs,
        rejected_runs=rejected_runs,
        pass_rate=round(pass_rate, 2),
        rejection_rate=round(rejection_rate, 2),
        median_duration_ms=median_duration_ms,
    )


@router.get("/{generation_id}", response_model=GenerationResponse)
def get_generation(
    generation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> GenerationResponse:
    record = session.exec(
        select(Generation).where(Generation.id == generation_id, Generation.user_id == current_user.id)
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Generation not found")
    return _to_response(record)


@router.delete("/{generation_id}")
def delete_generation(
    generation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> dict[str, str]:
    record = session.exec(
        select(Generation).where(Generation.id == generation_id, Generation.user_id == current_user.id)
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Generation not found")

    try:
        session.delete(record)
        session.commit()
    except Exception as exc:
        session.rollback()
        raise HTTPException(
            status_code=500,
            detail="Database error while deleting generation",
        ) from exc
    return {"status": "ok"}


@router.delete("")
def clear_generations(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> dict[str, int]:
    rows = session.exec(select(Generation).where(Generation.user_id == current_user.id)).all()
    try:
        for row in rows:
            session.delete(row)
        session.commit()
    except Exception as exc:
        session.rollback()
        raise HTTPException(
            status_code=500,
            detail="Database error while clearing generations",
        ) from exc
    return {"deleted": len(rows)}


@router.post("/{generation_id}/approve", response_model=GenerationResponse)
def approve_generation(
    generation_id: uuid.UUID,
    payload: GenerationActionRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> GenerationResponse:
    record = session.exec(
        select(Generation).where(Generation.id == generation_id, Generation.user_id == current_user.id)
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Generation not found")

    record.compliance_status = "APPROVED"
    record.status = "APPROVED"
    if payload.notes:
        record.compliance_notes = payload.notes
    record.completed_at = datetime.now(timezone.utc)
    try:
        session.add(record)
        session.commit()
        session.refresh(record)
    except Exception as exc:
        session.rollback()
        raise HTTPException(
            status_code=500,
            detail="Database error while approving generation",
        ) from exc
    return _to_response(record)


@router.post("/{generation_id}/reject", response_model=GenerationResponse)
def reject_generation(
    generation_id: uuid.UUID,
    payload: GenerationActionRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> GenerationResponse:
    record = session.exec(
        select(Generation).where(Generation.id == generation_id, Generation.user_id == current_user.id)
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Generation not found")

    record.compliance_status = "REJECTED"
    record.status = "REJECTED"
    if payload.notes:
        record.compliance_notes = payload.notes
    record.completed_at = datetime.now(timezone.utc)
    try:
        session.add(record)
        session.commit()
        session.refresh(record)
    except Exception as exc:
        session.rollback()
        raise HTTPException(
            status_code=500,
            detail="Database error while rejecting generation",
        ) from exc
    return _to_response(record)


@router.post("/{generation_id}/publish", response_model=GenerationResponse)
def publish_generation(
    generation_id: uuid.UUID,
    payload: GenerationActionRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> GenerationResponse:
    record = session.exec(
        select(Generation).where(Generation.id == generation_id, Generation.user_id == current_user.id)
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Generation not found")

    record.status = "PUBLISHED"
    if payload.notes:
        record.compliance_notes = payload.notes
    record.completed_at = datetime.now(timezone.utc)
    try:
        session.add(record)
        session.commit()
        session.refresh(record)
    except Exception as exc:
        session.rollback()
        raise HTTPException(
            status_code=500,
            detail="Database error while publishing generation",
        ) from exc
    return _to_response(record)
