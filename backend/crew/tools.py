from typing import List

import logging
import os
import time
import threading
from crewai.tools import tool
from ddgs import DDGS

logger = logging.getLogger(__name__)

_ddgs_lock = threading.Lock()

@tool("DuckDuckGo Search")
def duckduckgo_search_tool(query: str) -> str:
    """Search the web with DuckDuckGo and return a compact summary of top results."""
    logger.info(f"[TOOL] DuckDuckGo search running for query: {query}")
    results: List[dict] = []
    max_attempts = max(1, int(os.getenv("DDGS_MAX_ATTEMPTS", "2")))
    pre_query_delay = max(0.0, float(os.getenv("DDGS_PRE_QUERY_DELAY", "0.5")))
    backoff_base = max(1.0, float(os.getenv("DDGS_BACKOFF_BASE", "1.8")))
    
    with _ddgs_lock:
        # Try multiple times to handle rate limits
        for attempt in range(max_attempts):
            try:
                # Keep a small delay between queries to reduce provider throttling.
                time.sleep(pre_query_delay)
                with DDGS() as ddgs:
                    items = list(ddgs.text(query, max_results=4))
                    if items:
                        results.extend(items)
                        break
            except Exception as e:
                logger.warning(f"DDGS Exception on attempt {attempt+1}: {e}")

            # Back off before retrying (except after the final attempt).
            if attempt < max_attempts - 1:
                time.sleep(backoff_base ** attempt)

    if not results:
        return "No web results returned."

    lines = []
    for idx, item in enumerate(results, start=1):
        title = item.get("title", "No title")
        href = item.get("href", "No URL")
        body = item.get("body", "")
        lines.append(f"{idx}. {title}\nURL: {href}\nSnippet: {body}")
    return "\n\n".join(lines)
