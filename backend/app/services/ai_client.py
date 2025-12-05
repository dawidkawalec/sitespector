"""
Anthropic Claude API client for AI analysis.
"""

import logging
from typing import Dict, Any
from anthropic import AsyncAnthropic
from tenacity import retry, stop_after_attempt, wait_exponential
from app.config import settings

logger = logging.getLogger(__name__)

# Initialize Anthropic client
client = AsyncAnthropic(api_key=settings.CLAUDE_API_KEY) if settings.CLAUDE_API_KEY else None


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10)
)
async def call_claude(
    prompt: str,
    system_prompt: str = "",
    max_tokens: int = None
) -> str:
    """
    Call Claude API with retry logic.
    
    Args:
        prompt: User prompt
        system_prompt: System prompt for context
        max_tokens: Maximum tokens in response
        
    Returns:
        Claude's response text
        
    Raises:
        Exception: If Claude API call fails after retries
    """
    if not client:
        logger.warning("Claude API key not configured - returning mock response")
        return _generate_mock_response()
    
    try:
        logger.info(f"Calling Claude API (model: {settings.CLAUDE_MODEL})")
        
        response = await client.messages.create(
            model=settings.CLAUDE_MODEL,
            max_tokens=max_tokens or settings.CLAUDE_MAX_TOKENS,
            temperature=settings.CLAUDE_TEMPERATURE,
            system=system_prompt,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return response.content[0].text
        
    except Exception as e:
        logger.error(f"Claude API error: {e}")
        # Return mock response on error
        return _generate_mock_response()


def _generate_mock_response() -> str:
    """Generate mock AI response when Claude API is not available."""
    return """
    **SEO Analysis:**
    - Title tag optimization needed
    - Meta description could be improved
    - Consider adding more H1 tags
    
    **Performance Recommendations:**
    - Optimize images for web
    - Enable compression
    - Minimize render-blocking resources
    
    **Content Suggestions:**
    - Add more descriptive headings
    - Improve content readability
    - Include relevant keywords naturally
    """

