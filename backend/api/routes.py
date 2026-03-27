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
    content_type: str | None = Field(default=None, max_length=80)
    tone: str | None = Field(default=None, max_length=80)
    additional_context: str | None = None


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
def generate_content(
    payload: GenerateRequest,
) -> FinalContentOutput:
    try:
        result = run_content_pipeline(topic=payload.topic, audience=payload.audience)
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
