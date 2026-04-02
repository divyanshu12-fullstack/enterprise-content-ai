from crew.compliance import apply_deterministic_compliance


def test_banned_term_forces_rejected_with_exact_term_in_notes() -> None:
    payload = {
        "linkedin_post": "We guarantee outcomes for every team.",
        "twitter_post": "No issues here.",
        "image_prompt": "clean office image",
        "compliance_status": "APPROVED",
        "compliance_notes": "Looks good",
    }

    result = apply_deterministic_compliance(payload)

    assert result["compliance_status"] == "REJECTED"
    assert "Banned term 'guarantee'" in result["compliance_notes"]


def test_twitter_length_violation_rejected_and_trimmed() -> None:
    payload = {
        "linkedin_post": "Professional post.",
        "twitter_post": "x" * 331,
        "image_prompt": "clean office image",
        "compliance_status": "APPROVED",
        "compliance_notes": "Looks good",
    }

    result = apply_deterministic_compliance(payload, enforce_twitter_limit=True)

    assert result["compliance_status"] == "REJECTED"
    assert "twitter_post exceeds 330 characters" in result["compliance_notes"]
    assert len(result["twitter_post"]) == 330


def test_twitter_length_violation_ignored_if_disabled() -> None:
    payload = {
        "linkedin_post": "Professional post.",
        "twitter_post": "x" * 300,
        "image_prompt": "clean office image",
        "compliance_status": "APPROVED",
        "compliance_notes": "Passed deterministic compliance checks",
    }

    result = apply_deterministic_compliance(payload, enforce_twitter_limit=False)

    assert result["compliance_status"] == "APPROVED"
    assert "Passed deterministic compliance checks" in result["compliance_notes"]
    assert len(result["twitter_post"]) == 300


def test_custom_blocked_word_is_enforced() -> None:
    payload = {
        "linkedin_post": "This campaign is risk-free for all buyers.",
        "twitter_post": "Concise compliant text",
        "image_prompt": "clean office image",
        "compliance_status": "APPROVED",
        "compliance_notes": "Looks good",
    }

    result = apply_deterministic_compliance(payload, blocked_words=["risk-free"])

    assert result["compliance_status"] == "REJECTED"
    assert "Banned term 'risk-free'" in result["compliance_notes"]


def test_content_type_mismatch_rejection_stays_rejected() -> None:
    payload = {
        "linkedin_post": "Actionable enterprise rollout checklist.",
        "twitter_post": "Checklist for AI rollout in enterprises.",
        "image_prompt": "clean office image",
        "compliance_status": "REJECTED",
        "compliance_notes": "Content does not align with requested content type 'how-to-guide'.",
    }

    result = apply_deterministic_compliance(payload)

    assert result["compliance_status"] == "REJECTED"
    assert not result["compliance_notes"].startswith("Advisory:")
    assert "requested content type" in result["compliance_notes"]


def test_tone_mismatch_rejection_becomes_advisory_approval() -> None:
    payload = {
        "linkedin_post": "Professional copy that still sounds informal.",
        "twitter_post": "Casual but useful AI note.",
        "image_prompt": "clean office image",
        "compliance_status": "REJECTED",
        "compliance_notes": "Tone does not align with requested tone 'conversational'.",
    }

    result = apply_deterministic_compliance(payload)

    assert result["compliance_status"] == "APPROVED"
    assert result["compliance_notes"].startswith("Advisory:")
    assert "requested tone" in result["compliance_notes"]


def test_tone_and_content_type_mismatch_stays_rejected() -> None:
    payload = {
        "linkedin_post": "Copy with multiple alignment issues.",
        "twitter_post": "Multiple alignment issues.",
        "image_prompt": "clean office image",
        "compliance_status": "REJECTED",
        "compliance_notes": (
            "Tone does not align with requested tone 'professional'. "
            "Content does not align with requested content type 'how-to-guide'."
        ),
    }

    result = apply_deterministic_compliance(payload)

    assert result["compliance_status"] == "REJECTED"
    assert "requested content type" in result["compliance_notes"]


def test_hard_violation_overrides_alignment_advisory() -> None:
    payload = {
        "linkedin_post": "We guarantee outcomes while matching requested content type.",
        "twitter_post": "Compliant tweet",
        "image_prompt": "clean office image",
        "compliance_status": "REJECTED",
        "compliance_notes": "Tone does not align with requested tone 'professional'.",
    }

    result = apply_deterministic_compliance(payload)

    assert result["compliance_status"] == "REJECTED"
    assert "Banned term 'guarantee'" in result["compliance_notes"]
