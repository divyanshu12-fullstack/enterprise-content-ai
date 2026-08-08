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
    auto_generate_image: bool = True,
    enforce_twitter_limit: bool = True,
) -> list[Task]:
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
        "Include source URLs for every fact or statistic you cite."
        if include_source_urls
        else "Source URLs are optional for this run, but still preferred when available."
    )

    alignment_rules = (
        f"- Compare output with requested content type: {content_type_instruction}. "
        "If there is a mismatch, reject and state the content-type misalignment in compliance_notes.\n"
        f"- Compare output with requested tone: {tone_instruction}. "
        "If there is a mismatch, add an advisory note in compliance_notes but do not reject solely for this reason.\n"
    )

    # ── TASK 1: Research ──────────────────────────────────────────────────
    research_task = Task(
        description=(
            "Deep-dive research on the topic '{topic}' for audience '{audience}'.\n\n"
            "You MUST complete ALL of these sub-tasks:\n\n"
            "1. **Trending Hashtags**: Search for hashtags that are currently trending "
            "on Twitter/X and LinkedIn related to this topic. Find at least 8-10 "
            "hashtags that are actively being used TODAY — not generic evergreen tags. "
            "Search queries like '{topic} trending hashtags 2026', '{topic} viral Twitter', "
            "'{topic} LinkedIn trending' will help.\n\n"
            "2. **Fresh Statistics & Data Points**: Find 3-5 concrete, recent statistics "
            "or data points about this topic from reliable sources (research reports, "
            "industry publications, news outlets). Each stat must include its source URL.\n\n"
            "3. **Viral Content Patterns**: Identify what types of posts about this topic "
            "are going viral right now — what hooks are working, what formats (lists, "
            "stories, hot takes, data visualizations) are getting the most engagement.\n\n"
            "4. **Competitor/Influencer Analysis**: Note 2-3 examples of high-performing "
            "posts from thought leaders or brands on this topic. What made them work?\n\n"
            "5. **Content Angles**: Suggest 3 unique, non-obvious angles for the content "
            "that would stand out in a crowded feed.\n\n"
            "Prioritize facts that directly support the user's stated topic; avoid replacing "
            "a personal or individual achievement topic with broad institutional announcements.\n"
            f"{source_instruction}"
        ),
        expected_output=(
            "A comprehensive research brief containing:\n"
            "- A list of 8-10 currently trending hashtags (labeled as TRENDING HASHTAGS)\n"
            "- 3-5 concrete statistics with source URLs\n"
            "- Viral content patterns and winning formats observed\n"
            "- 2-3 competitor/influencer post examples\n"
            "- 3 unique content angles\n"
            "- Platform-specific insights for LinkedIn and Twitter/X"
        ),
        agent=researcher,
    )

    # ── TASK 2: Writing ───────────────────────────────────────────────────
    if enforce_twitter_limit:
        twitter_writing_instruction = (
            "**Twitter/X Post (280 characters max, single post — NOT a thread):**\n"
            "- Open with a scroll-stopping hook (bold claim, surprising stat, or provocative question)\n"
            "- Deliver ONE sharp, memorable insight\n"
            "- Include 1-2 of the TOP trending hashtags from the research brief\n"
            "- Every character counts — be ruthlessly concise\n"
            "- Use an emoji only if it adds meaning, not decoration\n"
            "- MUST be under 280 characters including hashtags and spaces"
        )
    else:
        twitter_writing_instruction = (
            "**Twitter/X Post (EXTENDED FORMAT — 600-800 characters, do NOT exceed 800):**\n"
            "This is an extended-format Twitter/X post. You MUST use the full character budget to create "
            "a rich, engaging, multi-paragraph post. Do NOT write a short tweet.\n\n"
            "Structure:\n"
            "- **Line 1 — The Hook** (pattern-interrupt): Start with a bold, surprising, or controversial "
            "statement that makes people stop scrolling. Examples: a counterintuitive stat, a myth-busting "
            "opener, a 'hot take' that challenges conventional wisdom.\n\n"
            "- **Lines 2-4 — The Story/Insight**: Develop the hook with a mini-narrative, data points, "
            "or a personal/industry anecdote. Use line breaks (\\n) between paragraphs for readability. "
            "Weave in 1-2 relevant statistics from the research brief.\n\n"
            "- **Lines 5-6 — The Takeaway & CTA**: End with a clear, actionable takeaway and a call "
            "to action (ask a question, invite opinions, encourage sharing).\n\n"
            "- **Hashtags**: Include 4-6 TRENDING hashtags from the research brief. Integrate them "
            "naturally into the text or place them at the end. These must be hashtags that are "
            "currently popular, not generic evergreen ones.\n\n"
            "- **Emojis**: Use 3-5 relevant emojis strategically — as bullet points, section dividers, "
            "or emphasis markers. Don't overdo it.\n\n"
            "- Use line breaks (\\n) generously to create visual breathing room\n"
            "- The tone should feel like a smart friend sharing insider knowledge, not a corporate announcement\n"
            "- AIM for 600-800 characters. Under 500 is TOO SHORT. Over 800 is TOO LONG."
        )

    writing_task = Task(
        description=(
            "Using the research brief, craft two pieces of high-impact social media content.\n\n"
            "**IMPORTANT**: Use the TRENDING HASHTAGS identified by the researcher. Do NOT "
            "make up generic hashtags — use the ones that are actually trending right now.\n\n"
            "---\n\n"
            "**LinkedIn Post (thought-leadership format, 1500-2500 characters):**\n"
            "- **Line 1 — The Hook**: A pattern-interrupt opening that makes professionals stop scrolling. "
            "Use one of these proven formats:\n"
            "  • A surprising statistic ('X% of companies are doing Y wrong...')\n"
            "  • A bold contrarian take ('Unpopular opinion: ...')\n"
            "  • A relatable problem ('Every [role] has faced this moment...')\n"
            "  • A before/after transformation ('6 months ago, we were struggling with X. Today...')\n\n"
            "- **Paragraphs 2-3 — The Insight**: Develop your argument with data from the research brief. "
            "Use specific numbers, name real trends, and provide actionable insights. Include a "
            "bullet-point list of 3-4 key takeaways if relevant.\n\n"
            "- **Final Paragraph — The CTA**: End with ONE clear call to action — ask a question, "
            "invite discussion, or share a resource. Make it conversational.\n\n"
            "- **Hashtags**: Add 5-8 trending hashtags at the end. Use the TRENDING HASHTAGS from "
            "the research brief. Mix broad reach tags with niche-specific ones.\n\n"
            "---\n\n"
            f"{twitter_writing_instruction}\n\n"
            "---\n\n"
            "**General Guidelines for BOTH platforms:**\n"
            f"- Requested content type: {content_type_instruction}\n"
            f"- Requested tone: {tone_instruction}\n"
            f"- Additional context from user: {additional_context_instruction}\n"
            "- Do NOT change the core scenario from the user's prompt (e.g., a personal "
            "achievement should not become an institutional announcement unless explicitly requested)\n"
            "- Avoid corporate buzzwords: 'game-changing', 'revolutionary', 'synergy', 'leverage'\n"
            "- Write with specificity and conviction — vague content gets ignored\n"
            "- Every sentence must earn its place — no filler"
        ),
        expected_output=(
            "A response containing clearly labeled sections:\n"
            "1. **LINKEDIN POST**: The complete LinkedIn post with hook, insights, CTA, and hashtags\n"
            "2. **TWITTER POST**: The complete Twitter/X post with hashtags"
        ),
        agent=writer,
        context=[research_task],
    )

    # ── TASK 3: Compliance ────────────────────────────────────────────────
    twitter_compliance_rule = (
        "- Reject if Twitter post is longer than 330 characters.\n"
        if enforce_twitter_limit
        else "- Twitter extended mode is enabled. Reject only if Twitter post exceeds 850 characters.\n"
    )

    compliance_task = Task(
        description=(
            "Review the drafts against these hard rules:\n"
            f"- Reject if content includes banned terms: {banned_terms_text}.\n"
            f"{twitter_compliance_rule}"
            f"{alignment_rules}"
            f"- Apply this policy text when making a compliance decision: {policy_text_instruction}.\n\n"
            "**IMPORTANT**: Do NOT strip or remove hashtags, emojis, line breaks, or engagement "
            "elements from the content unless they specifically violate a compliance rule. "
            "Your job is compliance review, not content editing.\n\n"
            "Output a JSON object with keys: linkedin_post, twitter_post, "
            "compliance_status, compliance_notes.\n"
            "compliance_status MUST be APPROVED or REJECTED.\n"
            "If REJECTED, compliance_notes must explicitly name the violated rule(s).\n"
            "If APPROVED, preserve the EXACT content from the writer — do not rephrase or shorten it."
        ),
        expected_output=(
            "A strict JSON object with the reviewed content (preserved exactly as written if approved) "
            "and compliance decision."
        ),
        agent=brand_governance,
        context=[writing_task],
    )

    # ── TASK 4: Visual ────────────────────────────────────────────────────
    visual_task = Task(
        description=(
            "Read the compliance-reviewed content and craft a cinematic, highly descriptive, "
            "comma-separated image generation prompt.\n\n"
            "Your prompt MUST include:\n"
            "- **Subject**: What is the main visual subject (person, object, scene, abstract concept)\n"
            "- **Composition**: Camera angle (eye-level, bird's eye, dramatic low angle, close-up), "
            "framing, depth of field\n"
            "- **Lighting**: Specific lighting style (golden hour warmth, dramatic rim lighting, "
            "soft diffused studio light, neon glow, natural window light)\n"
            "- **Color Palette**: Dominant colors and mood (warm earth tones, cool tech blues, "
            "vibrant gradients, monochromatic elegance)\n"
            "- **Style**: Artistic approach (photorealistic, 3D render, editorial illustration, "
            "cinematic photography, isometric design, minimalist flat design)\n"
            "- **Mood**: Emotional atmosphere (inspiring, futuristic, contemplative, energetic, serene)\n\n"
            "Rules:\n"
            "- Absolutely NO text, words, letters, numbers, or typography in the image\n"
            "- The visual must amplify the post's core message through imagery alone\n"
            "- Make it scroll-stopping — something that would stand out in a social media feed\n\n"
            f"Auto image generation enabled: {'yes' if auto_generate_image else 'no'}. "
            "If disabled, set image_prompt to 'Image generation disabled by settings.' "
            "and keep all other fields unchanged.\n\n"
            "Return a strict JSON object with EXACT keys:\n"
            "linkedin_post, twitter_post, image_prompt, compliance_status, compliance_notes\n"
            "Do not include markdown fences.\n"
            "CRITICAL: Preserve the linkedin_post and twitter_post EXACTLY as received from "
            "the compliance review — do not modify, shorten, or rephrase them."
        ),
        expected_output="A strict final JSON object matching the required schema.",
        agent=visual,
        context=[compliance_task],
    )

    print("[INIT] Tasks created: research -> writing -> compliance -> visual")
    return [research_task, writing_task, compliance_task, visual_task]

