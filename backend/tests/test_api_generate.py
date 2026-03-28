from fastapi.testclient import TestClient

from crew.schemas import FinalContentOutput


def test_generate_success(client: TestClient, auth_headers: dict[str, str], monkeypatch) -> None:
    def fake_pipeline(**kwargs) -> FinalContentOutput:
        assert kwargs["topic"] == "Enterprise AI governance"
        assert kwargs["audience"] == "executives"
        return FinalContentOutput(
            linkedin_post="LinkedIn draft",
            twitter_post="Twitter draft",
            image_prompt="A modern AI office visual",
            compliance_status="APPROVED",
            compliance_notes="Compliant",
        )

    monkeypatch.setattr("api.routes.run_content_pipeline", fake_pipeline)

    response = client.post(
        "/api/generate",
        headers=auth_headers,
        json={
            "topic": "Enterprise AI governance",
            "audience": "executives",
            "content_type": "thought-leadership",
            "tone": "professional",
            "additional_context": "Emphasize policy alignment",
            "policy_text": "Never make guaranteed claims",
        },
    )

    assert response.status_code == 200
    assert response.json()["compliance_status"] == "APPROVED"


def test_generate_422_for_invalid_payload(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.post(
        "/api/generate",
        headers=auth_headers,
        json={"topic": "x", "audience": "x"},
    )

    assert response.status_code == 422
