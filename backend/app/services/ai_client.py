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
    prompt_len = len(prompt or "")
    system_len = len(system_prompt or "")

    if not settings.GEMINI_API_KEY:
        logger.warning(
            "Gemini API key not configured - returning mock response "
            "(prompt_len=%s, system_len=%s)",
            prompt_len,
            system_len,
        )
        return _generate_mock_response(reason="missing_api_key")
    
    try:
        # Use Gemini 3.0 Flash Preview
        model_name = "gemini-3-flash-preview"
        logger.info(
            "Calling Gemini API (model=%s, prompt_len=%s, system_len=%s)",
            model_name,
            prompt_len,
            system_len,
        )
        
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
        
        text = response.text or ""
        preview = text[:180].replace("\n", " ")
        logger.info(
            "Gemini API success (model=%s, response_len=%s, preview=%s)",
            model_name,
            len(text),
            preview,
        )
        return text
        
    except asyncio.TimeoutError:
        logger.error(f"Gemini API TIMEOUT for model {model_name}")
        raise Exception(f"Gemini API call timed out after 30s")
    except Exception as e:
        logger.error(
            "Gemini API error (model=%s, error_type=%s): %s",
            model_name,
            type(e).__name__,
            e,
        )
        # Only return mock if it's a configuration issue or we want to allow partial success
        # For now, let's keep mock fallback but log it clearly
        logger.warning(
            "Returning mock response due to API error "
            "(prompt_len=%s, system_len=%s)",
            prompt_len,
            system_len,
        )
        msg = str(e)
        if "reported as leaked" in msg or "leaked" in msg:
            return _generate_mock_response(reason="api_key_leaked")
        if "exceeded your current quota" in msg or "ResourceExhausted" in msg or "429" in msg:
            return _generate_mock_response(reason="quota_exhausted")
        if "PermissionDenied" in msg or "403" in msg:
            return _generate_mock_response(reason="permission_denied")
        return _generate_mock_response(reason="unknown_error")


def _generate_mock_response(reason: str = "unknown") -> str:
    """Generate mock AI response when API is not available.

    IMPORTANT: Keep schema compatible with contextual and strategy contracts.
    """
    if reason == "quota_exhausted":
        headline = "AI fallback: przekroczony limit (quota/billing) dla Gemini API."
        recommendation = "Sprawdz limit i billing w panelu Gemini, a potem uruchom ponownie analizę AI."
        priority = "Brak quota/billing dla Gemini API - wyniki AI wymagają regeneracji."
    elif reason == "api_key_leaked":
        headline = "AI fallback: klucz API został zablokowany jako wyciek (leaked)."
        recommendation = "Wygeneruj nowy klucz Gemini API i uruchom ponownie analizę AI."
        priority = "Zablokowany klucz Gemini API - wyniki AI wymagają regeneracji."
    elif reason == "missing_api_key":
        headline = "AI fallback: brak konfiguracji klucza Gemini API."
        recommendation = "Skonfiguruj GEMINI_API_KEY i uruchom ponownie analizę AI."
        priority = "Brak GEMINI_API_KEY - wyniki AI wymagają regeneracji."
    else:
        headline = "AI fallback: model AI chwilowo niedostępny lub wystąpił błąd."
        recommendation = "Zweryfikuj konfigurację klucza Gemini i uruchom ponownie analizę AI."
        priority = "Brak wiarygodnej odpowiedzi modelu AI - dane kontekstowe wymagają regeneracji."

    return """
    {
        "key_findings": [
            "%s"
        ],
        "recommendations": [
            "%s"
        ],
        "quick_wins": [
            {
                "title": "Uruchom ponownie analizę AI po naprawie konfiguracji",
                "description": "Po przywróceniu łączności z modelem wygeneruj aktualne insighty dla wszystkich obszarów.",
                "impact": "medium",
                "effort": "easy"
            }
        ],
        "priority_issues": [
            "%s"
        ],
        "correlations": [
            "Fallback: korelacje cross-tool niedostępne, wymagane ponowne przeliczenie strategii."
        ],
        "synergies": [],
        "conflicts": [
            "Fallback: brak kompletnych danych strategii AI."
        ],
        "unified_recommendations": [
            "Po naprawie połączenia AI uruchom pełną regenerację strategii."
        ],
        "immediate_actions": [
            {
                "title": "Napraw konfigurację AI",
                "description": "Sprawdź poprawność API key i modelu Gemini.",
                "impact": "high",
                "area": "AI"
            }
        ],
        "short_term": [],
        "medium_term": [],
        "long_term": [],
        "overall_health": "moderate",
        "health_score": 50,
        "summary": "Fallback AI: zwrócono odpowiedź zastępczą, ponieważ model był chwilowo niedostępny.",
        "strengths": [],
        "critical_issues": [
            "Model AI niedostępny - część rekomendacji może być niekompletna."
        ],
        "growth_potential": "Po przywróceniu działania AI możliwe jest wygenerowanie pełnej strategii wzrostu.",
        "estimated_impact": "medium",
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
    """ % (headline, recommendation, priority)
