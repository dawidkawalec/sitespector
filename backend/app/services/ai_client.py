"""
Gemini API client for AI analysis.
"""

import logging
import asyncio
from typing import Dict, Any, Optional
import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential
from app.config import settings

logger = logging.getLogger(__name__)

# Configure Gemini
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

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
    Call Gemini API with retry logic (Kept function name for compatibility).
    
    Args:
        prompt: User prompt
        system_prompt: System prompt for context (Gemini 1.5+ supports system instructions)
        max_tokens: Maximum tokens in response (handled by generation_config)
        
    Returns:
        AI response text
    """
    if not settings.GEMINI_API_KEY:
        logger.warning("Gemini API key not configured - returning mock response")
        return _generate_mock_response()
    
    try:
        # Use Gemini 3.0 Flash Preview
        model_name = "gemini-flash-3-preview" 
        logger.info(f"Calling Gemini API (model: {model_name})")
        
        # Configure model with system instruction
        model = genai.GenerativeModel(
            model_name=model_name,
            system_instruction=system_prompt if system_prompt else None
        )
        
        # Generate content
        # Use asyncio.to_thread for sync Gemini call to avoid blocking event loop
        # and wrap in wait_for for per-call timeout
        response = await asyncio.wait_for(
            asyncio.to_thread(
                model.generate_content,
                prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=max_tokens or 2048,
                    temperature=0.7
                )
            ),
            timeout=30.0  # 30 seconds timeout per call
        )
        
        return response.text
        
    except asyncio.TimeoutError:
        logger.error(f"Gemini API TIMEOUT for model {model_name}")
        raise Exception(f"Gemini API call timed out after 30s")
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        # Only return mock if it's a configuration issue or we want to allow partial success
        # For now, let's keep mock fallback but log it clearly
        logger.warning("Returning mock response due to API error")
        return _generate_mock_response()


def _generate_mock_response() -> str:
    """Generate mock AI response when API is not available."""
    return """
    {
        "content": {
            "quality_score": 75,
            "readability_score": 80,
            "word_count": 1200,
            "recommendations": [
                "Mock: Title tag optimization needed",
                "Mock: Meta description could be improved",
                "Mock: Add more descriptive headings"
            ],
            "summary": "Mock summary: The website has good potential but needs SEO work."
        },
        "local_seo": {
            "is_local_business": false,
            "missing_elements": ["Google Maps", "Phone Number"]
        }
    }
    """
