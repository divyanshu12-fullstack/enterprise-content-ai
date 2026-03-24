import pytest

from crew.schemas import FinalContentOutput


def test_final_content_output_valid() -> None:
    output = FinalContentOutput(
        linkedin_post="A professional LinkedIn post.",
        twitter_post="A concise tweet under 280 chars.",
        image_prompt="cinematic office scene, blue accents, shallow depth of field",
        compliance_status="APPROVED",
        compliance_notes="Passed all checks.",
    )
    assert output.compliance_status == "APPROVED"


def test_invalid_compliance_status_rejected() -> None:
    with pytest.raises(ValueError):
        FinalContentOutput(
            linkedin_post="x",
            twitter_post="y",
            image_prompt="z",
            compliance_status="PENDING",
            compliance_notes="x",
        )


def test_twitter_post_limit_enforced() -> None:
    with pytest.raises(ValueError):
        FinalContentOutput(
            linkedin_post="x",
            twitter_post="x" * 281,
            image_prompt="z",
            compliance_status="APPROVED",
            compliance_notes="x",
        )


def test_required_non_empty_fields_enforced() -> None:
    with pytest.raises(ValueError):
        FinalContentOutput(
            linkedin_post="",
            twitter_post="valid",
            image_prompt="valid",
            compliance_status="APPROVED",
            compliance_notes="valid",
        )
