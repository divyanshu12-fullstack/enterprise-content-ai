from crewai import Task


def build_tasks(agents: dict) -> list[Task]:
    researcher = agents["researcher"]
    writer = agents["writer"]
    brand_governance = agents["brand_governance"]
    visual = agents["visual"]

    research_task = Task(
        description=(
            "Research the topic '{topic}' for audience '{audience}'. Find timely facts, "
            "data points, and trends from reliable web sources.\n"
            "Return concise bullet points with citations/URLs."
        ),
        expected_output=(
            "A concise research brief with bullets and source URLs that are safe to cite."
        ),
        agent=researcher,
    )

    writing_task = Task(
        description=(
            "Using the research brief, draft two outputs:\n"
            "1) A 3-paragraph professional LinkedIn post with one clear CTA\n"
            "2) A 280-character Twitter post (single post, not multi-post thread).\n"
            "Keep tone professional and actionable. Avoid hype language."
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
            "- Reject if content includes banned terms: 'guarantee', 'promise', "
            "or 'investment advice'.\n"
            "- Reject if tone is not professional.\n"
            "- Reject if Twitter post is longer than 280 characters.\n"
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
