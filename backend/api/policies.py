from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel

from api.deps import get_current_user
from api.policy_parser import extract_policy_text
from db.models import User

router = APIRouter(prefix="/api/policies", tags=["policies"])

MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
MAX_POLICY_TEXT_CHARS = 15000


class PolicyUploadResponse(BaseModel):
    filename: str
    extension: str
    char_count: int
    truncated: bool
    policy_text: str


@router.post("/upload", response_model=PolicyUploadResponse)
async def upload_policy(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
) -> PolicyUploadResponse:
    if not file.filename:
        raise HTTPException(status_code=422, detail="Missing filename")

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=422, detail="Empty file uploaded")
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 5MB")

    extracted_text, extension = extract_policy_text(file.filename, file_bytes)
    truncated = len(extracted_text) > MAX_POLICY_TEXT_CHARS
    policy_text = extracted_text[:MAX_POLICY_TEXT_CHARS] if truncated else extracted_text

    return PolicyUploadResponse(
        filename=file.filename,
        extension=extension,
        char_count=len(policy_text),
        truncated=truncated,
        policy_text=policy_text,
    )
