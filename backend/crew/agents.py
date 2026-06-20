import logging
import os
from crewai import Agent, LLM

logger = logging.getLogger(__name__)

from crew.tools import duckduckgo_search_tool

# ---------------------------------------------------------------------------
# Free models available on OpenRouter (no user API key required)
# "openrouter/auto" is a special router that auto-selects the best
# available free model — it never goes stale.
# ---------------------------------------------------------------------------
FREE_MODELS = [
    "openrouter/auto",
    "google/gemini-2.5-flash:free",
    "deepseek/deepseek-chat-v3:free",
    "qwen/qwen3-235b-a22b:free",
    "microsoft/mai-ds-r1:free",
]

DEFAULT_MODEL = "openrouter/auto"
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"


def _verbose_enabled() -> bool:
    return os.getenv("CREW_VERBOSE", "true").lower() in {"1", "true", "yes", "on"}


def is_free_model(model_name: str) -> bool:
    """Check whether a model ID is a free OpenRouter model."""
    name = model_name.strip()
    return name.endswith(":free") or name == "openrouter/auto"


def _build_llm(
    model_name: str | None = None,
    api_key: str | None = None,
    temperature: float | None = None,
) -> LLM:
    api_key = api_key or os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError(
            "OPENROUTER_API_KEY is not set. Add it to your environment before running the crew."
        )

    model_name = model_name or os.getenv("OPENROUTER_MODEL", DEFAULT_MODEL)

    # CrewAI uses litellm under the hood — prefix with openrouter/ so it
    # routes through the OpenRouter gateway correctly.
    # Skip prefixing if already prefixed or if using the special auto router.
    if not model_name.startswith("openrouter/"):
        model_name = f"openrouter/{model_name}"

    if temperature is None:
        temperature = float(os.getenv("OPENROUTER_TEMPERATURE", "0.2"))
    llm_timeout = max(5.0, float(os.getenv("LLM_TIMEOUT_SECONDS", "45")))

    logger.info(f"[INIT] OpenRouter model configured: {model_name}")
    return LLM(
        model=model_name,
        api_key=api_key,
        temperature=temperature,
        timeout=llm_timeout,
        base_url=OPENROUTER_BASE_URL,
    )


def build_agents(
    model_name: str | None = None,
    api_key: str | None = None,
    temperature: float | None = None,
) -> dict[str, Agent]:
    llm = _build_llm(model_name=model_name, api_key=api_key, temperature=temperature)
    verbose = _verbose_enabled()
    max_execution_time = max(10, int(os.getenv("AGENT_MAX_EXECUTION_SECONDS", "120")))

    researcher = Agent(
        role="Senior Market Researcher",
        goal=(
            "Scrape the web for the latest trends, data points, and news regarding "
            "the provided topic."
        ),
        backstory=(
            "You are an analytical genius who finds obscure but highly relevant facts. "
            "You always base your findings on current data."
        ),
        tools=[duckduckgo_search_tool],
        llm=llm,
        verbose=verbose,
        allow_delegation=False,
        max_iter=2,
        max_execution_time=max_execution_time,
    )

    writer = Agent(
        role="Enterprise Content Strategist",
        goal=(
            "Transform research into two distinct formats: a 3-paragraph professional "
            "LinkedIn post with a single clear CTA and no hype language, and a "
            "280-character Twitter post."
        ),
        backstory=(
            "You are a master copywriter. You know that LinkedIn requires a professional, "
            "insightful tone, while Twitter requires punchy, engaging hooks."
        ),
        llm=llm,
        verbose=verbose,
        allow_delegation=False,
        max_iter=2,
        max_execution_time=max_execution_time,
    )

    brand_governance = Agent(
        role="Chief Legal & Brand Compliance Officer",
        goal=(
            "Review the Writer's drafts against hardcoded company rules and provide "
            "hard rejections for content-type misalignment and advisory notes for tone misalignment."
        ),
        backstory=(
            "You are ruthless. You flag any content that uses banned words like "
            "'guarantee,' 'promise,' or 'investment advice.' You record content-type and tone "
            "misalignment separately: content-type mismatch is blocking, tone mismatch is non-blocking guidance."
        ),
        llm=llm,
        verbose=verbose,
        allow_delegation=False,
        max_iter=1,
        max_execution_time=max_execution_time,
    )

    visual = Agent(
        role="Creative Art Director",
        goal=(
            "Read the approved draft and write a highly descriptive, comma-separated "
            "image generation prompt with composition guidance. Avoid text-heavy visuals."
        ),
        backstory=(
            "You convert business messaging into vivid visual directions suitable for "
            "text-to-image models."
        ),
        llm=llm,
        verbose=verbose,
        allow_delegation=False,
        max_iter=1,
        max_execution_time=max_execution_time,
    )

    return {
        "researcher": researcher,
        "writer": writer,
        "brand_governance": brand_governance,
        "visual": visual,
    }
