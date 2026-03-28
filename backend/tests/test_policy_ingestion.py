import pytest

from api.policy_parser import extract_policy_text
from fastapi import HTTPException


def test_extract_policy_text_from_txt() -> None:
    text, extension = extract_policy_text(
        filename="policy.txt",
        file_bytes=b"No guarantee language.\nKeep claims evidence-based.",
    )

    assert extension == ".txt"
    assert "No guarantee language." in text


def test_extract_policy_text_rejects_unsupported_extension() -> None:
    with pytest.raises(HTTPException) as exc:
        extract_policy_text(filename="policy.csv", file_bytes=b"header,value")

    assert exc.value.status_code == 422
    assert "Unsupported file type" in str(exc.value.detail)
