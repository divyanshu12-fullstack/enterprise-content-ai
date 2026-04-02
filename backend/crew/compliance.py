from __future__ import annotations

import re
from typing import Any

DEFAULT_BANNED_TERMS = ["guarantee", "promise", "investment advice"]
TWITTER_REJECTION_CHAR_LIMIT = 330


def _normalize_terms(blocked_words: list[str] | None) -> list[str]:
    terms: list[str] = []
    for candidate in [*DEFAULT_BANNED_TERMS, *(blocked_words or [])]:
        value = candidate.strip()
        if not value:
            continue
        if value.lower() in {existing.lower() for existing in terms}:
            continue
        terms.append(value)
    return terms


def _contains_term(text: str, term: str) -> bool:
    # Match whole words for single-token terms; phrase terms use substring match.
    if " " in term:
        return term.lower() in text.lower()
    pattern = re.compile(rf"\b{re.escape(term)}\b", flags=re.IGNORECASE)
    return bool(pattern.search(text))


def _has_mismatch_signal(notes: str) -> bool:
    normalized = notes.lower()
    return any(
        token in normalized
        for token in ("does not align", "not align", "mismatch", "misaligned")
    )


def _is_content_type_mismatch_note(notes: str) -> bool:
    normalized = notes.lower()
    mentions_type = any(
        token in normalized
        for token in ("content type", "requested content type")
    )
    return mentions_type and _has_mismatch_signal(notes)


def _is_tone_mismatch_note(notes: str) -> bool:
    normalized = notes.lower()
    mentions_tone = any(token in normalized for token in ("tone", "requested tone"))
    return mentions_tone and _has_mismatch_signal(notes)


def apply_deterministic_compliance(
    payload: dict[str, Any],
    blocked_words: list[str] | None = None,
    enforce_twitter_limit: bool = True,
) -> dict[str, Any]:
    linkedin_post = str(payload.get("linkedin_post", "") or "")
    twitter_post = str(payload.get("twitter_post", "") or "")
    image_prompt = str(payload.get("image_prompt", "") or "")

    violations: list[str] = []
    banned_terms = _normalize_terms(blocked_words)

    for term in banned_terms:
        if _contains_term(linkedin_post, term):
            violations.append(f"Banned term '{term}' found in linkedin_post")
        if _contains_term(twitter_post, term):
            violations.append(f"Banned term '{term}' found in twitter_post")

    if enforce_twitter_limit and len(twitter_post) > TWITTER_REJECTION_CHAR_LIMIT:
        violations.append(f"twitter_post exceeds {TWITTER_REJECTION_CHAR_LIMIT} characters")
        twitter_post = twitter_post[:TWITTER_REJECTION_CHAR_LIMIT]

    status = str(payload.get("compliance_status", "")).strip().upper()
    notes = str(payload.get("compliance_notes", "") or "").strip()

    if violations:
        status = "REJECTED"
        notes = "; ".join(violations)
    else:
        if (
            status == "REJECTED"
            and _is_tone_mismatch_note(notes)
            and not _is_content_type_mismatch_note(notes)
        ):
            status = "APPROVED"
            if notes and not notes.lower().startswith("advisory:"):
                notes = f"Advisory: {notes}"
        if status not in {"APPROVED", "REJECTED"}:
            status = "APPROVED"
        if not notes:
            notes = "Passed deterministic compliance checks."

    return {
        "linkedin_post": linkedin_post,
        "twitter_post": twitter_post,
        "image_prompt": image_prompt,
        "compliance_status": status,
        "compliance_notes": notes,
    }
