"""
Gemini embeddings client used by the RAG subsystem.

Provider: Google Generative AI (google-generativeai)
Model: models/text-embedding-004
"""

from __future__ import annotations

import asyncio
import logging
from typing import List, Literal

import google.generativeai as genai

from app.services.ai_client import _get_gemini_api_keys, AIUnavailableError

logger = logging.getLogger(__name__)


EmbeddingTaskType = Literal["retrieval_query", "retrieval_document"]


async def embed_text(text: str, task_type: EmbeddingTaskType) -> List[float]:
    """
    Return embedding vector for provided text.

    Note: google-generativeai is sync; run in a thread.
    """
    keys = _get_gemini_api_keys()
    if not keys:
        raise AIUnavailableError("missing_api_key")

    # Embeddings are cheap; use the first available key.
    genai.configure(api_key=keys[0])

    def _embed() -> List[float]:
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type=task_type,
        )
        # Library returns dict-like structure with `embedding` key
        vec = result.get("embedding") if isinstance(result, dict) else getattr(result, "embedding", None)
        if vec is None:
            raise RuntimeError("Missing embedding in response")
        return list(vec)

    return await asyncio.to_thread(_embed)


async def embed_query(text: str) -> List[float]:
    return await embed_text(text=text, task_type="retrieval_query")


async def embed_document(text: str) -> List[float]:
    return await embed_text(text=text, task_type="retrieval_document")

