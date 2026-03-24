from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pydantic import Field
from pydantic import ValidationError

from crew.crew_logic import run_content_pipeline
from crew.schemas import FinalContentOutput

router = APIRouter(prefix="/api", tags=["content"])


class GenerateRequest(BaseModel):
    topic: str = Field(..., min_length=3, max_length=300)
    audience: str = Field(..., min_length=2, max_length=120)


class ErrorResponse(BaseModel):
    error: str
    detail: str | list[dict]


class ErrorEnvelope(BaseModel):
    detail: ErrorResponse


@router.post(
    "/generate",
    response_model=FinalContentOutput,
    responses={
        422: {"model": ErrorEnvelope},
        500: {"model": ErrorEnvelope},
    },
)
def generate_content(payload: GenerateRequest) -> FinalContentOutput:
    try:
        return run_content_pipeline(topic=payload.topic, audience=payload.audience)
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
