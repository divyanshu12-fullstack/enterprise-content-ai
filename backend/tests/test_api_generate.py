import time

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


def test_generate_timeout_returns_504(client: TestClient, auth_headers: dict[str, str], monkeypatch) -> None:
    def fake_pipeline(**kwargs) -> FinalContentOutput:
        time.sleep(2)
        return FinalContentOutput(
            linkedin_post="LinkedIn draft",
            twitter_post="Twitter draft",
            image_prompt="Prompt",
            compliance_status="APPROVED",
            compliance_notes="OK",
        )

    monkeypatch.setattr("api.routes.run_content_pipeline", fake_pipeline)
    monkeypatch.setattr("api.routes.GENERATION_TIMEOUT_SECONDS", 1)

    response = client.post(
        "/api/generate",
        headers=auth_headers,
        json={
            "topic": "Enterprise AI governance",
            "audience": "executives",
        },
    )

    assert response.status_code == 504
    assert response.json()["detail"]["error"] == "generation_timeout"


def test_generate_stream_timeout_emits_error_and_done(
    client: TestClient,
    auth_headers: dict[str, str],
    monkeypatch,
) -> None:
    def fake_pipeline(**kwargs) -> FinalContentOutput:
        time.sleep(2)
        return FinalContentOutput(
            linkedin_post="LinkedIn draft",
            twitter_post="Twitter draft",
            image_prompt="Prompt",
            compliance_status="APPROVED",
            compliance_notes="OK",
        )

    monkeypatch.setattr("api.routes.run_content_pipeline", fake_pipeline)
    monkeypatch.setattr("api.routes.GENERATION_TIMEOUT_SECONDS", 1)
    monkeypatch.setattr("api.routes.STREAM_STALL_TIMEOUT_SECONDS", 1)

    with client.stream(
        "POST",
        "/api/generate/stream",
        headers=auth_headers,
        json={
            "topic": "Enterprise AI governance",
            "audience": "executives",
        },
    ) as response:
        body = response.read().decode("utf-8")

    assert response.status_code == 200
    assert "event: error" in body
    assert "generation_timeout" in body
    assert "event: done" in body


def test_generate_returns_503_when_capacity_full(client: TestClient, auth_headers: dict[str, str], monkeypatch) -> None:
    class _BusySlot:
        def acquire(self, blocking: bool = False) -> bool:
            return False

        def release(self) -> None:
            return None

    monkeypatch.setattr("api.routes.generation_slots", _BusySlot())

    response = client.post(
        "/api/generate",
        headers=auth_headers,
        json={
            "topic": "Enterprise AI governance",
            "audience": "executives",
        },
    )

    assert response.status_code == 503
    assert response.json()["detail"]["error"] == "generation_busy"
