import json
import re
import uuid
from typing import Any

from crewai import Crew, Process
from dotenv import load_dotenv
from pydantic import ValidationError
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_fixed

from crew.agents import build_agents
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


@retry(
    stop=stop_after_attempt(2),
    wait=wait_fixed(1),
    retry=retry_if_exception_type((ValueError, ValidationError, json.JSONDecodeError)),
    reraise=True,
)
def _kickoff_and_validate(crew: Crew, topic: str, audience: str, run_id: str) -> FinalContentOutput:
    print(f"[TASK {run_id}] Kicking off crew execution...")
    result = crew.kickoff(inputs={"topic": topic, "audience": audience})

    raw_output = getattr(result, "raw", str(result))
    print(f"\n[RESULT {run_id}] Raw final output from crew:")
    print(raw_output)

    parsed_json = _extract_json_block(raw_output)
    validated = FinalContentOutput.model_validate(parsed_json)
    return validated


def run_content_pipeline(topic: str, audience: str) -> FinalContentOutput:
    run_id = uuid.uuid4().hex[:8]
    print(f"\n[INIT {run_id}] Starting CrewAI content pipeline")
    print(f"[INIT {run_id}] Topic: {topic}")
    print(f"[INIT {run_id}] Audience: {audience}")

    agents = build_agents()
    tasks = build_tasks(agents)

    crew = Crew(
        agents=list(agents.values()),
        tasks=tasks,
        process=Process.sequential,
        verbose=True,
    )

    validated = _kickoff_and_validate(crew=crew, topic=topic, audience=audience, run_id=run_id)

    print(f"\n[VALIDATION {run_id}] Parsed + validated FinalContentOutput:")
    print(validated.model_dump_json(indent=2))
    return validated


if __name__ == "__main__":
    load_dotenv()
    print("[TEST] Running PHASE 1 terminal test for CrewAI backend")
    print("[TEST] This will execute all 4 agents with verbose logs.\n")

    sample_topic = "AI governance trends in enterprise marketing for 2026"
    sample_audience = "B2B marketing leaders"

    final_output = run_content_pipeline(topic=sample_topic, audience=sample_audience)

    print("\n[TEST] Final structured JSON (ready for API response):")
    print(final_output.model_dump_json(indent=2))
