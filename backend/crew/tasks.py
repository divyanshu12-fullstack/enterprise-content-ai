from crewai import Task


def build_tasks(
    agents: dict,
    content_type: str | None = None,
    tone: str | None = None,
    additional_context: str | None = None,
    policy_text: str | None = None,
    blocked_words: list[str] | None = None,
    strict_compliance: bool = True,
    include_source_urls: bool = True,
    auto_generate_image: bool = True,    enforce_twitter_limit: bool = True,) -> list[Task]:
    researcher = agents["researcher"]
    writer = agents["writer"]
    brand_governance = agents["brand_governance"]
    visual = agents["visual"]

    content_type_instruction = content_type or "not specified"
    tone_instruction = tone or "professional"
    additional_context_instruction = additional_context or "none"
    policy_text_instruction = policy_text or "none"

    banned_terms = ["guarantee", "promise", "investment advice"]
    for word in blocked_words or []:
        normalized = word.strip()
        if normalized and normalized.lower() not in {w.lower() for w in banned_terms}:
            banned_terms.append(normalized)
    banned_terms_text = ", ".join(f"'{word}'" for word in banned_terms)

    source_instruction = (
        "Return concise bullet points with citations/URLs."
        if include_source_urls
        else "Return concise bullet points. Source URLs are optional for this run."
    )

    strict_tone_rule = "- Reject if tone is not professional.\n" if strict_compliance else ""

    research_task = Task(
        description=(
            "Research the topic '{topic}' for audience '{audience}'. Find timely facts, "
            "data points, and trends from reliable web sources.\n"
            f"{source_instruction}"
        ),
        expected_output=(
            "A concise research brief with bullets and source URLs that are safe to cite."
        ),
        agent=researcher,
    )

    twitter_instruction = "280-character Twitter post (single post, not multi-post thread)." if enforce_twitter_limit else "Make twitter post for a user with 800 char limit(don't exceed this) use relevant and trendy hastags."
    twitter_compliance_rule = "- Reject if Twitter post is longer than 330 characters.\n" if enforce_twitter_limit else ""

    writing_task = Task(
        description=(
            "Using the research brief, draft two outputs:\n"
            "1) A 3-paragraph professional LinkedIn post with one clear CTA\n"
            f"2) A {twitter_instruction}\n"
            "Keep tone professional and actionable. Avoid hype language.\n"
            f"Requested content type: {content_type_instruction}.\n"
            f"Requested tone: {tone_instruction}.\n"
            f"Additional context from user: {additional_context_instruction}.\n"
            "Provide 5-6 good relevant hastags, for better wider audience reach relevant to the current topic.\n"
            "For Twitter, include hashtags only as many as fit within the configured character limit."
        ),
        expected_output=(
            "A response containing clearly labeled LinkedIn and Twitter drafts."
        ),
        agent=writer,
        context=[research_task],
    )

    compliance_task = Task(
        description=(
            "Review the drafts against these hard rules:\n"
            f"- Reject if content includes banned terms: {banned_terms_text}.\n"
            f"{strict_tone_rule}"
            f"{twitter_compliance_rule}"
            f"- Also verify the output aligns with requested content type: {content_type_instruction}.\n"
            f"- Also verify the output aligns with requested tone: {tone_instruction}.\n"
            f"- Apply this policy text when making a compliance decision: {policy_text_instruction}.\n"
            "Output a JSON object with keys: linkedin_post, twitter_post, "
            "compliance_status, compliance_notes.\n"
            "compliance_status MUST be APPROVED or REJECTED.\n"
            "If REJECTED, compliance_notes must explicitly name the violated rule(s)."
        ),
        expected_output=(
            "A strict JSON object with reviewed content and compliance decision."
        ),
        agent=brand_governance,
        context=[writing_task],
    )

    visual_task = Task(
        description=(
            "Read the compliance-reviewed content and craft a highly descriptive, "
            "comma-separated image prompt with composition guidance.\n"
            "Avoid text-heavy visuals.\n"
            f"Auto image generation enabled: {'yes' if auto_generate_image else 'no'}. "
            "If disabled, set image_prompt to 'Image generation disabled by settings.' and keep all other fields unchanged.\n"
            "Return a strict JSON object with EXACT keys:\n"
            "linkedin_post, twitter_post, image_prompt, compliance_status, compliance_notes\n"
            "Do not include markdown fences."
        ),
        expected_output="A strict final JSON object matching the required schema.",
        agent=visual,
        context=[compliance_task],
    )

    print("[INIT] Tasks created: research -> writing -> compliance -> visual")
    return [research_task, writing_task, compliance_task, visual_task]
