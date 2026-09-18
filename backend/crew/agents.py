import logging
import os
from crewai import Agent, LLM

logger = logging.getLogger(__name__)

from crew.tools import duckduckgo_search_tool
from config import DEFAULT_MODEL

# ---------------------------------------------------------------------------
# Free models available on OpenRouter (no user API key required)
# "openrouter/auto" is a special router that auto-selects the best
# available free model — it never goes stale.
# "openrouter/free" is the free-model fallback router shown as "Any Free".
# ---------------------------------------------------------------------------
FREE_MODELS = [
    "deepseek/deepseek-v4-flash-0731:free",
    "z-ai/glm-5.2:free",
    "nvidia/nemotron-3.5-lightning:free",
    "openrouter/free",
]

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"


def _verbose_enabled() -> bool:
    return os.getenv("CREW_VERBOSE", "true").lower() in {"1", "true", "yes", "on"}


def is_free_model(model_name: str) -> bool:
    """Check whether a model ID is a free OpenRouter model."""
    name = model_name.strip()
    return name.endswith(":free") or name in {"openrouter/auto", "openrouter/free"}


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
    enforce_twitter_limit: bool = True,
) -> dict[str, Agent]:
    llm = _build_llm(model_name=model_name, api_key=api_key, temperature=temperature)
    verbose = _verbose_enabled()
    max_execution_time = max(10, int(os.getenv("AGENT_MAX_EXECUTION_SECONDS", "120")))

    # ── Researcher ────────────────────────────────────────────────────────
    researcher = Agent(
        role="Senior Social Media Trend Researcher & Data Analyst",
        goal=(
            "Hunt the web for the FRESHEST trends, breaking news, viral angles, "
            "and currently trending hashtags related to the provided topic. "
            "Find 3-5 concrete statistics or data points with source URLs. "
            "Identify what competitor and influencer content is gaining traction "
            "on LinkedIn and Twitter/X right now. Surface the hashtags that are "
            "trending TODAY — not generic evergreen tags."
        ),
        backstory=(
            "You are an elite social media intelligence analyst with deep expertise "
            "in platform algorithms, viral content patterns, and real-time trend detection. "
            "You have spent 12+ years tracking what makes content explode on LinkedIn and "
            "Twitter/X. You understand engagement velocity, hashtag momentum, and how "
            "platform algorithms reward timely, data-backed content. You never settle for "
            "stale data — you dig until you find the freshest stats, the hottest takes, "
            "and the hashtags that are surging RIGHT NOW. You also analyze competitor "
            "posts to identify content gaps and winning formats."
        ),
        tools=[duckduckgo_search_tool],
        llm=llm,
        verbose=verbose,
        allow_delegation=False,
        max_iter=2,
        max_execution_time=max_execution_time,
    )

    # ── Writer ────────────────────────────────────────────────────────────
    if enforce_twitter_limit:
        twitter_goal_fragment = (
            "a punchy, scroll-stopping Twitter/X post within 280 characters "
            "that hooks instantly, delivers one sharp insight, and includes "
            "1-2 of the top trending hashtags identified by the researcher."
        )
    else:
        twitter_goal_fragment = (
            "a rich, detailed, multi-paragraph Twitter/X post (600-800 characters) "
            "that tells a compelling story with a strong hook in the first line, "
            "uses line breaks and emojis for readability, weaves in data points, "
            "includes 4-6 trending hashtags, and ends with a clear call to action. "
            "Make it feel like a viral thread opener that people MUST engage with."
        )

    writer = Agent(
        role="Elite Social Media Copywriter & Viral Content Architect",
        goal=(
            "Transform the researcher's findings into two distinct, high-impact pieces: "
            "1) A thought-leadership LinkedIn post with a pattern-interrupt hook, "
            "data-backed insights across 3-4 paragraphs, bullet-point takeaways, "
            "a single compelling CTA, and 5-8 trending hashtags. "
            f"2) {twitter_goal_fragment} "
            "Every piece must feel timely, authentic, and impossible to scroll past."
        ),
        backstory=(
            "You are a viral content architect who has ghostwritten for Fortune 100 "
            "executives and built personal brands from zero to 500K+ followers on "
            "LinkedIn and Twitter/X. You master engagement psychology: you know that "
            "the first line decides whether someone reads or scrolls. You use proven "
            "copywriting frameworks — PAS (Problem-Agitate-Solve), AIDA (Attention-"
            "Interest-Desire-Action), and Before→After→Bridge — but make them feel "
            "natural, never formulaic. You understand that LinkedIn rewards bold opinions "
            "backed by data, while Twitter/X rewards sharp wit, relatable takes, and "
            "timely cultural references. You ALWAYS weave in trending hashtags organically "
            "— never as an afterthought appended at the end. You avoid corporate jargon, "
            "buzzwords like 'game-changing' or 'revolutionary', and empty hype. "
            "Instead, you write with specificity, conviction, and a human voice that "
            "makes readers feel like they're getting insider knowledge."
        ),
        llm=llm,
        verbose=verbose,
        allow_delegation=False,
        max_iter=2,
        max_execution_time=max_execution_time,
    )

    # ── Brand Governance ──────────────────────────────────────────────────
    brand_governance = Agent(
        role="Chief Legal & Brand Compliance Officer",
        goal=(
            "Review the Writer's drafts against hardcoded company rules and provide "
            "hard rejections for content-type misalignment and advisory notes for "
            "tone misalignment. Preserve the content's engagement quality — do not "
            "strip hashtags, emojis, or stylistic choices unless they violate policy."
        ),
        backstory=(
            "You are a meticulous brand safety expert with a legal background. "
            "You flag any content that uses banned words like 'guarantee,' 'promise,' "
            "or 'investment advice.' You record content-type and tone misalignment "
            "separately: content-type mismatch is blocking, tone mismatch is "
            "non-blocking guidance. You understand that social media content should "
            "be engaging — your job is to ensure compliance WITHOUT killing the "
            "content's viral potential. You never remove trending hashtags or emojis "
            "unless they violate specific policy rules."
        ),
        llm=llm,
        verbose=verbose,
        allow_delegation=False,
        max_iter=1,
        max_execution_time=max_execution_time,
    )

    # ── Visual Art Director ───────────────────────────────────────────────
    visual = Agent(
        role="Executive Creative & AI Art Director",
        goal=(
            "Read the approved draft and craft a cinematic, highly descriptive, "
            "comma-separated image generation prompt with detailed composition "
            "guidance including mood, lighting style, color palette, camera angle, "
            "and artistic style. The visual must amplify the post's message and "
            "stop the scroll. Absolutely NO text, words, or typography in the image."
        ),
        backstory=(
            "You are an award-winning creative director who has led visual campaigns "
            "for global brands. You think in terms of editorial photography, cinematic "
            "compositions, and mood boards. You convert business messaging into vivid "
            "visual directions that text-to-image models can render beautifully. "
            "You specify lighting (golden hour, dramatic rim light, soft diffused), "
            "color palettes (complementary, analogous, monochromatic), camera angles "
            "(eye-level, bird's eye, dramatic low angle), and artistic styles "
            "(photorealistic, 3D render, editorial illustration, isometric). "
            "You NEVER include text or typography in image prompts — the visual must "
            "communicate through imagery alone."
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
