import json
import re
import uuid
from typing import Any
from collections.abc import Callable

from crewai import Crew, Process
from dotenv import load_dotenv
from pydantic import ValidationError

from crew.agents import build_agents
from crew.compliance import apply_deterministic_compliance
from crew.schemas import FinalContentOutput
from crew.tasks import build_tasks


def _extract_json_block(text: str) -> dict[str, Any]:
    cleaned = text.strip()

    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
        cleaned = re.sub(r"```$", "", cleaned).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
        if not match:
            raise ValueError("No JSON object found in crew output.")
        return json.loads(match.group(0))


def _kickoff_and_validate(
    crew: Crew,
    topic: str,
    audience: str,
    run_id: str,
    content_type: str | None = None,
    tone: str | None = None,
    additional_context: str | None = None,
    policy_text: str | None = None,
    blocked_words: list[str] | None = None,
    progress_callback: Callable[[str, str], None] | None = None,
) -> FinalContentOutput:
    if progress_callback:
        progress_callback("research", "Gathering market context")
    print(f"[TASK {run_id}] Kicking off crew execution...")
    result = crew.kickoff(
        inputs={
            "topic": topic,
            "audience": audience,
            "content_type": content_type or "",
            "tone": tone or "",
            "additional_context": additional_context or "",
            "policy_text": policy_text or "",
        }
    )

    raw_output = getattr(result, "raw", str(result))
    if progress_callback:
        progress_callback("writing", "Drafting LinkedIn and Twitter content")
    print(f"\n[RESULT {run_id}] Raw final output from crew:")
    print(raw_output)

    parsed_json = _extract_json_block(raw_output)
    if progress_callback:
        progress_callback("compliance", "Applying deterministic compliance checks")
    parsed_json = apply_deterministic_compliance(parsed_json, blocked_words=blocked_words)
    validated = FinalContentOutput.model_validate(parsed_json)
    if progress_callback:
        progress_callback("visual", "Preparing final visual prompt package")
    return validated


def run_content_pipeline(
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
    progress_callback: Callable[[str, str], None] | None = None,
) -> FinalContentOutput:
    run_id = uuid.uuid4().hex[:8]
    print(f"\n[INIT {run_id}] Starting CrewAI content pipeline")
    print(f"[INIT {run_id}] Topic: {topic}")
    print(f"[INIT {run_id}] Audience: {audience}")
    if content_type:
        print(f"[INIT {run_id}] Content type: {content_type}")
    if tone:
        print(f"[INIT {run_id}] Tone: {tone}")
    if additional_context:
        print(f"[INIT {run_id}] Additional context provided: yes")
    if policy_text:
        print(f"[INIT {run_id}] Policy text provided: yes")
    if model_name:
        print(f"[INIT {run_id}] Runtime model override: {model_name}")
    if progress_callback:
        progress_callback("init", "Initializing generation pipeline")

    agents = build_agents(model_name=model_name, api_key=api_key)
    tasks = build_tasks(
        agents,
        content_type=content_type,
        tone=tone,
        additional_context=additional_context,
        policy_text=policy_text,
        blocked_words=blocked_words,
        strict_compliance=strict_compliance,
        include_source_urls=include_source_urls,
        auto_generate_image=auto_generate_image,
    )

    crew = Crew(
        agents=list(agents.values()),
        tasks=tasks,
        process=Process.sequential,
        verbose=True,
    )

    attempts = 1 + max(0, max_retries) if auto_retry else 1
    last_error: Exception | None = None
    validated: FinalContentOutput | None = None

    for attempt in range(1, attempts + 1):
        try:
            if progress_callback and attempts > 1:
                progress_callback("retry", f"Running attempt {attempt} of {attempts}")
            validated = _kickoff_and_validate(
                crew=crew,
                topic=topic,
                audience=audience,
                run_id=run_id,
                content_type=content_type,
                tone=tone,
                additional_context=additional_context,
                policy_text=policy_text,
                blocked_words=blocked_words,
                progress_callback=progress_callback,
            )
            break
        except (ValueError, ValidationError, json.JSONDecodeError) as exc:
            last_error = exc
            print(f"[VALIDATION {run_id}] Attempt {attempt}/{attempts} failed: {exc}")
            if attempt == attempts:
                raise

    if validated is None:
        raise last_error or RuntimeError("Pipeline validation failed without a captured error")

    print(f"\n[VALIDATION {run_id}] Parsed + validated FinalContentOutput:")
    print(validated.model_dump_json(indent=2))
    if progress_callback:
        progress_callback("done", "Generation complete")
    return validated


if __name__ == "__main__":
    load_dotenv()
    print("[TEST] Running PHASE 1 terminal test for CrewAI backend")
    print("[TEST] This will execute all 4 agents with verbose logs.\n")

    sample_topic = "AI governance trends in enterprise marketing for 2026"
    sample_audience = "B2B marketing leaders"

    final_output = run_content_pipeline(
        topic=sample_topic,
        audience=sample_audience,
        content_type="industry-insights",
        tone="professional",
        additional_context="Focus on governance and measurable ROI for enterprise teams.",
        policy_text="Do not use guarantee language or financial claims.",
    )

    print("\n[TEST] Final structured JSON (ready for API response):")
    print(final_output.model_dump_json(indent=2))
