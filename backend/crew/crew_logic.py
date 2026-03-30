import json
import os
import re
import time
import uuid
import logging
from typing import Any
from collections.abc import Callable

from crewai import Crew, Process
from dotenv import load_dotenv
from pydantic import ValidationError

from crew.agents import build_agents
from crew.compliance import apply_deterministic_compliance
from crew.schemas import FinalContentOutput
from crew.tasks import build_tasks

logger = logging.getLogger(__name__)


def _verbose_enabled() -> bool:
    return os.getenv("CREW_VERBOSE", "false").lower() in {"1", "true", "yes", "on"}


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
    enforce_twitter_limit: bool = True,
) -> FinalContentOutput:
    if progress_callback:
        progress_callback("research", "Gathering market context")
    logger.info(f"[TASK {run_id}] Kicking off crew execution...")
    result = crew.kickoff(
        inputs={
            "topic": topic,
            "audience": audience,
            "content_type": content_type or "",
            "tone": tone or "",
            "additional_context": additional_context or "",
            "policy_text": policy_text or "",
            "enforce_twitter_limit": str(enforce_twitter_limit).lower(),
        }
    )

    raw_output = getattr(result, "raw", str(result))

    logger.info(f"\n[RESULT {run_id}] Raw final output from crew:\n{raw_output}")

    parsed_json = _extract_json_block(raw_output)

    parsed_json = apply_deterministic_compliance(
        parsed_json,
        blocked_words=blocked_words,
        enforce_twitter_limit=enforce_twitter_limit
    )
    validated = FinalContentOutput.model_validate(parsed_json)

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
    enforce_twitter_limit: bool = True,
) -> FinalContentOutput:
    run_id = uuid.uuid4().hex[:8]
    logger.info(f"\n[INIT {run_id}] Starting CrewAI content pipeline")
    logger.info(f"[INIT {run_id}] Topic: {topic}")
    logger.info(f"[INIT {run_id}] Audience: {audience}")
    if content_type:
        logger.info(f"[INIT {run_id}] Content type: {content_type}")
    if tone:
        logger.info(f"[INIT {run_id}] Tone: {tone}")
    if additional_context:
        logger.info(f"[INIT {run_id}] Additional context provided: yes")
    if policy_text:
        logger.info(f"[INIT {run_id}] Policy text provided: yes")
    if model_name:
        logger.info(f"[INIT {run_id}] Runtime model override: {model_name}")
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
        enforce_twitter_limit=enforce_twitter_limit,
    )


    # Map stages
    stages = ["research", "writing", "compliance", "visual"]
    for i, t in enumerate(tasks):
        def make_cb(stage_name):
            def cb(output):
                if progress_callback:
                    # Fire next stage
                    try:
                        next_idx = stages.index(stage_name) + 1
                        if next_idx < len(stages):
                            cb.called = getattr(cb, "called", 0) + 1
                            if cb.called == 1:
                                progress_callback(stages[next_idx], f"Started {stages[next_idx]} task")
                    except:
                        pass
            return cb
        if i < len(stages):
            t.callback = make_cb(stages[i])

    crew = Crew(
        agents=list(agents.values()),
        tasks=tasks,
        process=Process.sequential,
        verbose=_verbose_enabled(),
    )

    # Keep retries conservative to reduce total wall-clock latency.
    max_retries = min(max(0, max_retries), 1)
    attempts = 1 + max_retries if auto_retry else 1
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
                enforce_twitter_limit=enforce_twitter_limit,
            )
            break
        except (ValueError, ValidationError, json.JSONDecodeError) as exc:
            last_error = exc
            logger.error(f"[VALIDATION {run_id}] Attempt {attempt}/{attempts} failed: {exc}")
            if attempt < attempts:
                time.sleep(0.75 * attempt)
            if attempt == attempts:
                raise

    if validated is None:
        raise last_error or RuntimeError("Pipeline validation failed without a captured error")

    logger.info(f"\n[VALIDATION {run_id}] Parsed + validated FinalContentOutput:\n{validated.model_dump_json(indent=2)}")
    if progress_callback:
        progress_callback("done", "Generation complete")
    return validated


if __name__ == "__main__":
    load_dotenv()
    logger.info("[TEST] Running PHASE 1 terminal test for CrewAI backend")
    logger.info("[TEST] This will execute all 4 agents with verbose logs.\n")

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

    logger.info("\n[TEST] Final structured JSON (ready for API response):")
    logger.info(final_output.model_dump_json(indent=2))
