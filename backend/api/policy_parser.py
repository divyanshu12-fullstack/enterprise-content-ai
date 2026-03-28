from __future__ import annotations

from io import BytesIO
from pathlib import Path

from docx import Document
from fastapi import HTTPException
from pypdf import PdfReader

SUPPORTED_EXTENSIONS = {".txt", ".pdf", ".docx"}


def extract_text_from_txt(file_bytes: bytes) -> str:
    try:
        return file_bytes.decode("utf-8")
    except UnicodeDecodeError:
        return file_bytes.decode("latin-1", errors="ignore")


def extract_text_from_pdf(file_bytes: bytes) -> str:
    reader = PdfReader(BytesIO(file_bytes))
    parts: list[str] = []
    for page in reader.pages:
        page_text = page.extract_text() or ""
        if page_text.strip():
            parts.append(page_text)
    return "\n\n".join(parts)


def extract_text_from_docx(file_bytes: bytes) -> str:
    doc = Document(BytesIO(file_bytes))
    parts = [p.text.strip() for p in doc.paragraphs if p.text and p.text.strip()]
    return "\n".join(parts)


def extract_policy_text(filename: str, file_bytes: bytes) -> tuple[str, str]:
    extension = Path(filename).suffix.lower()
    if extension not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported file type '{extension}'. Supported: txt, pdf, docx.",
        )

    try:
        if extension == ".txt":
            text = extract_text_from_txt(file_bytes)
        elif extension == ".pdf":
            text = extract_text_from_pdf(file_bytes)
        else:
            text = extract_text_from_docx(file_bytes)
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - defensive guard around parser libraries
        raise HTTPException(status_code=422, detail=f"Failed to parse policy file: {exc}") from exc

    normalized = text.replace("\r\n", "\n").replace("\r", "\n").strip()
    if not normalized:
        raise HTTPException(status_code=422, detail="Policy file contains no extractable text")

    return normalized, extension
