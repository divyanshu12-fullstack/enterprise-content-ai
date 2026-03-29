from typing import List

import logging
import time
from crewai.tools import tool
from ddgs import DDGS

logger = logging.getLogger(__name__)


@tool("DuckDuckGo Search")
def duckduckgo_search_tool(query: str) -> str:
    """Search the web with DuckDuckGo and return a compact summary of top results."""
    logger.info(f"[TOOL] DuckDuckGo search running for query: {query}")
    results: List[dict] = []
    
    # Try multiple times to handle rate limits
    for attempt in range(3):
        try:
            with DDGS() as ddgs:
                items = list(ddgs.text(query, max_results=5))
                if items:
                    results.extend(items)
                    break
        except Exception as e:
            logger.warning(f"DDGS Exception on attempt {attempt+1}: {e}")
        
        # Back off before retrying
        time.sleep(2 ** attempt)

    if not results:
        return "No web results returned."

    lines = []
    for idx, item in enumerate(results, start=1):
        title = item.get("title", "No title")
        href = item.get("href", "No URL")
        body = item.get("body", "")
        lines.append(f"{idx}. {title}\nURL: {href}\nSnippet: {body}")
    return "\n\n".join(lines)
