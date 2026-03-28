from crew.schemas import FinalContentOutput
import importlib
import os
import sys
import types


def _import_routes_with_stub(fake_run_content_pipeline):
    os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
    stub_module = types.ModuleType("crew.crew_logic")
    stub_module.run_content_pipeline = fake_run_content_pipeline
    sys.modules["crew.crew_logic"] = stub_module

    from api import routes

    return importlib.reload(routes)


def test_generate_route_passes_full_input_to_pipeline(monkeypatch) -> None:
    captured: dict[str, str | None] = {}

    def fake_run_content_pipeline(
        topic: str,
        audience: str,
        content_type: str | None = None,
        tone: str | None = None,
        additional_context: str | None = None,
        policy_text: str | None = None,
        model_name: str | None = None,
        api_key: str | None = None,
        auto_retry: bool = True,
        max_retries: int = 2,
        include_source_urls: bool = True,
        auto_generate_image: bool = True,
        strict_compliance: bool = True,
        blocked_words: list[str] | None = None,
    ) -> FinalContentOutput:
        captured["topic"] = topic
        captured["audience"] = audience
        captured["content_type"] = content_type
        captured["tone"] = tone
        captured["additional_context"] = additional_context
        captured["policy_text"] = policy_text
        captured["model_name"] = model_name
        captured["api_key"] = api_key
        captured["auto_retry"] = str(auto_retry)
        captured["max_retries"] = str(max_retries)
        captured["include_source_urls"] = str(include_source_urls)
        captured["auto_generate_image"] = str(auto_generate_image)
        captured["strict_compliance"] = str(strict_compliance)
        captured["blocked_words"] = ",".join(blocked_words or [])
        return FinalContentOutput(
            linkedin_post="LinkedIn output",
            twitter_post="Twitter output",
            image_prompt="Image prompt",
            compliance_status="APPROVED",
            compliance_notes="Passed all checks",
        )

    routes = _import_routes_with_stub(fake_run_content_pipeline)

    payload = routes.GenerateRequest(
        topic="AI governance in enterprise marketing",
        audience="executives",
        content_type="industry-insights",
        tone="professional",
        additional_context="Focus on measurable outcomes and governance.",
        policy_text="Never mention guaranteed returns.",
    )

    monkeypatch.setattr(
        routes,
        "_resolve_runtime_settings",
        lambda session, current_user: routes.RuntimeSettings(
            model_name="gemini-3.1-pro",
            api_key="user-key-1234567890",
            auto_retry=False,
            max_retries=1,
            include_source_urls=False,
            auto_generate_image=False,
            strict_compliance=False,
            blocked_words=["risk-free", "guaranteed returns"],
        ),
    )

    response = routes.generate_content(payload, current_user=None, session=None)

    assert response.compliance_status == "APPROVED"
    assert captured == {
        "topic": "AI governance in enterprise marketing",
        "audience": "executives",
        "content_type": "industry-insights",
        "tone": "professional",
        "additional_context": "Focus on measurable outcomes and governance.",
        "policy_text": "Never mention guaranteed returns.",
        "model_name": "gemini-3.1-pro",
        "api_key": "user-key-1234567890",
        "auto_retry": "False",
        "max_retries": "1",
        "include_source_urls": "False",
        "auto_generate_image": "False",
        "strict_compliance": "False",
        "blocked_words": "risk-free,guaranteed returns",
    }


def test_generate_route_handles_missing_optional_inputs() -> None:
    captured: dict[str, str | None] = {}

    def fake_run_content_pipeline(
        topic: str,
        audience: str,
        content_type: str | None = None,
        tone: str | None = None,
        additional_context: str | None = None,
        policy_text: str | None = None,
        model_name: str | None = None,
        api_key: str | None = None,
        auto_retry: bool = True,
        max_retries: int = 2,
        include_source_urls: bool = True,
        auto_generate_image: bool = True,
        strict_compliance: bool = True,
        blocked_words: list[str] | None = None,
    ) -> FinalContentOutput:
        captured["topic"] = topic
        captured["audience"] = audience
        captured["content_type"] = content_type
        captured["tone"] = tone
        captured["additional_context"] = additional_context
        captured["policy_text"] = policy_text
        return FinalContentOutput(
            linkedin_post="LinkedIn output",
            twitter_post="Twitter output",
            image_prompt="Image prompt",
            compliance_status="APPROVED",
            compliance_notes="Passed all checks",
        )

    routes = _import_routes_with_stub(fake_run_content_pipeline)

    payload = routes.GenerateRequest(
        topic="AI ops",
        audience="marketers",
    )

    routes.generate_content(payload, current_user=None, session=None)

    assert captured == {
        "topic": "AI ops",
        "audience": "marketers",
        "content_type": None,
        "tone": None,
        "additional_context": None,
        "policy_text": None,
    }
