from typing import List

import logging
from crewai.tools import tool
from duckduckgo_search import DDGS

logger = logging.getLogger(__name__)


@tool("DuckDuckGo Search")
def duckduckgo_search_tool(query: str) -> str:
    """Search the web with DuckDuckGo and return a compact summary of top results."""
    logger.info(f"[TOOL] DuckDuckGo search running for query: {query}")
    results: List[dict] = []
    with DDGS() as ddgs:
        for item in ddgs.text(query, max_results=5):
            results.append(item)

    if not results:
        return "No web results returned."

    lines = []
    for idx, item in enumerate(results, start=1):
        title = item.get("title", "No title")
        href = item.get("href", "No URL")
        body = item.get("body", "")
        lines.append(f"{idx}. {title}\nURL: {href}\nSnippet: {body}")
    return "\n\n".join(lines)
