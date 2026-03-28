import os

from crewai import Agent, LLM

from crew.tools import duckduckgo_search_tool


def _build_llm(
    model_name: str | None = None,
    api_key: str | None = None,
    temperature: float | None = None,
) -> LLM:
    api_key = api_key or os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY is not set. Add it to your environment before running the crew."
        )

    model_name = model_name or os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    if not model_name.startswith("gemini/"):
        model_name = f"gemini/{model_name}"
    if temperature is None:
        temperature = float(os.getenv("GEMINI_TEMPERATURE", "0.2"))

    print(f"[INIT] Gemini model configured: {model_name}")
    return LLM(
        model=model_name,
        api_key=api_key,
        temperature=temperature,
    )


def build_agents(
    model_name: str | None = None,
    api_key: str | None = None,
    temperature: float | None = None,
) -> dict[str, Agent]:
    llm = _build_llm(model_name=model_name, api_key=api_key, temperature=temperature)

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
        verbose=True,
        allow_delegation=False,
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
        verbose=True,
        allow_delegation=False,
    )

    brand_governance = Agent(
        role="Chief Legal & Brand Compliance Officer",
        goal="Review the Writer's drafts against hardcoded company rules.",
        backstory=(
            "You are ruthless. You flag any content that uses banned words like "
            "'guarantee,' 'promise,' or 'investment advice.' You ensure the tone is professional."
        ),
        llm=llm,
        verbose=True,
        allow_delegation=False,
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
        verbose=True,
        allow_delegation=False,
    )

    print("[INIT] Agents created: Researcher, Writer, Brand Governance, Visual")
    return {
        "researcher": researcher,
        "writer": writer,
        "brand_governance": brand_governance,
        "visual": visual,
    }
