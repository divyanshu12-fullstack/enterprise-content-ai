from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pydantic import ValidationError

from crew.crew_logic import run_content_pipeline
from crew.schemas import FinalContentOutput

router = APIRouter(prefix="/api", tags=["content"])


class GenerateRequest(BaseModel):
    topic: str
    audience: str


@router.post("/generate", response_model=FinalContentOutput)
def generate_content(payload: GenerateRequest) -> FinalContentOutput:
    # PHASE 1 note: endpoint exists for scaffolding but full API verification is PHASE 2.
    try:
        return run_content_pipeline(topic=payload.topic, audience=payload.audience)
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors()) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
