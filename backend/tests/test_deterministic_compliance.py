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
