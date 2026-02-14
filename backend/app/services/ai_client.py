"""
Gemini API client for AI analysis.
"""

import logging
import asyncio
import os
import time
from typing import Dict, Any, Optional, List
import google.generativeai as genai
from app.config import settings

logger = logging.getLogger(__name__)

class AIUnavailableError(RuntimeError):
    """Raised when AI provider is temporarily unavailable or misconfigured."""

    def __init__(self, reason: str) -> None:
        super().__init__(reason)
        self.reason = reason


# Simple in-process circuit breaker to avoid spamming provider after repeated 429s.
_circuit_open_until: float = 0.0
_circuit_reason: str = ""


def _get_gemini_api_keys() -> List[str]:
    """Return ordered list of Gemini API keys (primary + fallbacks).

    Secrets MUST come from environment only (VPS .env), never from repo.
    """
    keys: List[str] = []

    primary = (settings.GEMINI_API_KEY or "").strip()
    if primary:
        keys.append(primary)

    fallback = (getattr(settings, "GEMINI_API_KEY_FALLBACK", "") or "").strip()
    if fallback:
        keys.append(fallback)

    extra = (getattr(settings, "GEMINI_API_KEYS", "") or os.getenv("GEMINI_API_KEYS") or "").strip()
    if extra:
        for part in extra.split(","):
            k = part.strip()
            if k:
                keys.append(k)

    # De-duplicate while preserving order
    uniq: List[str] = []
    seen = set()
    for k in keys:
        if k not in seen:
            uniq.append(k)
            seen.add(k)
    return uniq

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
    global _circuit_open_until, _circuit_reason

    prompt_len = len(prompt or "")
    system_len = len(system_prompt or "")

    # If we've recently hit a hard provider limit, short-circuit quickly.
    now = time.time()
    if _circuit_open_until and now < _circuit_open_until:
        logger.warning(
            "AI temporarily unavailable (circuit_open reason=%s, open_for_seconds=%s)",
            _circuit_reason,
            int(_circuit_open_until - now),
        )
        raise AIUnavailableError("temporarily_unavailable")

    api_keys = _get_gemini_api_keys()
    if not api_keys:
        logger.warning("Gemini API key not configured (prompt_len=%s, system_len=%s)", prompt_len, system_len)
        raise AIUnavailableError("missing_api_key")
    
    # Use Gemini 3.0 Flash Preview
    model_name = "gemini-3-flash-preview"
    last_reason = "unknown_error"
    quota_exhausted_count = 0

    for idx, key in enumerate(api_keys):
        try:
            genai.configure(api_key=key)
            logger.info(
                "Calling Gemini API (model=%s, key_index=%s/%s, prompt_len=%s, system_len=%s)",
                model_name,
                idx + 1,
                len(api_keys),
                prompt_len,
                system_len,
            )

            model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=system_prompt if system_prompt else None,
            )

            response = await asyncio.wait_for(
                asyncio.to_thread(
                    model.generate_content,
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        max_output_tokens=max_tokens or 2048,
                        temperature=0.7,
                    ),
                ),
                timeout=30.0,
            )

            text = response.text or ""
            preview = text[:180].replace("\n", " ")
            logger.info(
                "Gemini API success (model=%s, key_index=%s/%s, response_len=%s, preview=%s)",
                model_name,
                idx + 1,
                len(api_keys),
                len(text),
                preview,
            )
            return text

        except asyncio.TimeoutError:
            last_reason = "timeout"
            logger.error(
                "Gemini API TIMEOUT (model=%s, key_index=%s/%s)",
                model_name,
                idx + 1,
                len(api_keys),
            )
            continue

        except Exception as e:
            msg = str(e)
            if "reported as leaked" in msg or "leaked" in msg:
                last_reason = "api_key_leaked"
            elif "exceeded your current quota" in msg or "ResourceExhausted" in msg or "429" in msg:
                last_reason = "quota_exhausted"
                quota_exhausted_count += 1
            elif "PermissionDenied" in msg or "403" in msg:
                last_reason = "permission_denied"
            else:
                last_reason = "unknown_error"

            logger.error(
                "Gemini API error (model=%s, key_index=%s/%s, error_type=%s): %s",
                model_name,
                idx + 1,
                len(api_keys),
                type(e).__name__,
                e,
            )

            # If we have another key, try it; otherwise fallback.
            continue

    # If all keys hit quota, open circuit briefly to avoid hammering provider in the same process.
    if quota_exhausted_count and quota_exhausted_count == len(api_keys):
        _circuit_open_until = time.time() + 60.0
        _circuit_reason = "quota_exhausted"

    logger.warning("AI unavailable after trying all Gemini keys (reason=%s, keys_tried=%s)", last_reason, len(api_keys))
    raise AIUnavailableError(last_reason)


def _generate_mock_response(reason: str = "unknown") -> str:
    """Generate mock AI response when API is not available.

    IMPORTANT: Keep schema compatible with contextual and strategy contracts.
    """
    if reason == "quota_exhausted":
        headline = "AI fallback: AI jest chwilowo niedostepne."
        recommendation = "Sprobuj ponownie pozniej i uruchom ponownie analize AI."
        priority = "AI niedostepne - wyniki AI wymagaja regeneracji."
    elif reason == "api_key_leaked":
        headline = "AI fallback: AI jest chwilowo niedostepne."
        recommendation = "Sprobuj ponownie pozniej i uruchom ponownie analize AI."
        priority = "AI niedostepne - wyniki AI wymagaja regeneracji."
    elif reason == "missing_api_key":
        headline = "AI fallback: AI jest chwilowo niedostepne."
        recommendation = "Sprobuj ponownie pozniej i uruchom ponownie analize AI."
        priority = "AI niedostepne - wyniki AI wymagaja regeneracji."
    else:
        headline = "AI fallback: AI jest chwilowo niedostepne."
        recommendation = "Sprobuj ponownie pozniej i uruchom ponownie analize AI."
        priority = "AI niedostepne - wyniki AI wymagaja regeneracji."

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
