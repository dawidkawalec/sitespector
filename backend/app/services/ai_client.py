"""
Gemini API client for AI analysis.
"""

import logging
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
        system_prompt: System prompt for context (Gemini 1.5 supports system instructions)
        max_tokens: Maximum tokens in response (handled by generation_config)
        
    Returns:
        AI response text
    """
    if not settings.GEMINI_API_KEY:
        logger.warning("Gemini API key not configured - returning mock response")
        return _generate_mock_response()
    
    try:
        # Use Gemini 3.0 Flash
        model_name = "gemini-3-flash" 
        logger.info(f"Calling Gemini API (model: {model_name})")
        
        # Configure model with system instruction
        model = genai.GenerativeModel(
            model_name=model_name,
            system_instruction=system_prompt if system_prompt else None
        )
        
        # Generate content
        # Note: Gemini python client is sync by default but fast. 
        # For true async in FastAPI, we might need to run in threadpool or use async client if available.
        # But for now, standard call is fine for worker.
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=max_tokens or 2048,
                temperature=0.7
            )
        )
        
        return response.text
        
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        # Return mock response on error to prevent crash
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
