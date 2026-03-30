from typing import List

import logging
import os
import time
import threading
from crewai.tools import tool
from ddgs import DDGS

logger = logging.getLogger(__name__)

_ddgs_lock = threading.Lock()
_ddgs_failures = 0


def _ddgs_text_with_timeout(query: str, max_results: int, timeout_seconds: float) -> list[dict]:
    result_holder: dict[str, list[dict] | Exception | None] = {"items": None, "error": None}

    def _worker() -> None:
        try:
            with DDGS() as ddgs:
                result_holder["items"] = list(ddgs.text(query, max_results=max_results))
        except Exception as exc:
            result_holder["error"] = exc

    thread = threading.Thread(target=_worker, daemon=True)
    thread.start()
    thread.join(timeout_seconds)

    if thread.is_alive():
        raise TimeoutError(f"DDGS query timed out after {timeout_seconds:.1f}s")
    if result_holder["error"] is not None:
        raise result_holder["error"]  # type: ignore[misc]
    return result_holder["items"] or []

@tool("DuckDuckGo Search")
def duckduckgo_search_tool(query: str) -> str:
    """Search the web with DuckDuckGo and return a compact summary of top results."""
    logger.info(f"[TOOL] DuckDuckGo search running for query: {query}")
    results: List[dict] = []
    max_attempts = max(1, int(os.getenv("DDGS_MAX_ATTEMPTS", "2")))
    pre_query_delay = max(0.0, float(os.getenv("DDGS_PRE_QUERY_DELAY", "0.5")))
    backoff_base = max(1.0, float(os.getenv("DDGS_BACKOFF_BASE", "1.8")))
    timeout_seconds = max(2.0, float(os.getenv("DDGS_TIMEOUT_SECONDS", "8")))
    breaker_threshold = max(1, int(os.getenv("DDGS_CIRCUIT_BREAKER_THRESHOLD", "3")))

    global _ddgs_failures
    if _ddgs_failures >= breaker_threshold:
        logger.warning("DDGS circuit breaker active; skipping search and returning fail-soft response")
        return "Search temporarily unavailable. Proceeding without fresh web results."
    
    # Try multiple times to handle transient issues without stalling the full pipeline.
    for attempt in range(max_attempts):
        try:
            # Keep a small delay between queries to reduce provider throttling.
            time.sleep(pre_query_delay)
            with _ddgs_lock:
                items = _ddgs_text_with_timeout(query=query, max_results=4, timeout_seconds=timeout_seconds)
            if items:
                results.extend(items)
                _ddgs_failures = 0
                break
        except Exception as e:
            _ddgs_failures += 1
            logger.warning(f"DDGS Exception on attempt {attempt+1}: {e}")

        # Back off before retrying (except after the final attempt).
        if attempt < max_attempts - 1:
            time.sleep(backoff_base ** attempt)

    if not results:
        return "No web results returned. Proceeding with internal knowledge only."

    lines = []
    for idx, item in enumerate(results, start=1):
        title = item.get("title", "No title")
        href = item.get("href", "No URL")
        body = item.get("body", "")
        lines.append(f"{idx}. {title}\nURL: {href}\nSnippet: {body}")
    return "\n\n".join(lines)
