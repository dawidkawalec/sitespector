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
import httpx

from app.services.ai_client import _get_gemini_api_keys, AIUnavailableError

logger = logging.getLogger(__name__)


EmbeddingTaskType = Literal["retrieval_query", "retrieval_document"]


EMBEDDING_MODELS = [
    "models/gemini-embedding-001",
    "models/text-embedding-004",
]


_BATCH_EMBED_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"


async def embed_texts_batch(texts: List[str], task_type: EmbeddingTaskType) -> List[List[float]]:
    """
    Batch-embed multiple texts in one request (Gemini API `batchEmbedContents`).

    This is critical for RAG indexing where we might embed hundreds of chunks.
    Doing it one-by-one can easily hit quota/rate limits.

    Tries all available Gemini API keys and embedding models with fallback.
    """
    if not texts:
        return []

    keys = _get_gemini_api_keys()
    if not keys:
        raise AIUnavailableError("missing_api_key")

    last_error: Exception | None = None

    for idx, key in enumerate(keys):
        for model_name in EMBEDDING_MODELS:
            try:
                url = f"{_BATCH_EMBED_BASE_URL}/{model_name}:batchEmbedContents"
                body = {
                    "requests": [
                        {
                            "model": model_name,
                            "content": {"parts": [{"text": t}]},
                            "taskType": "RETRIEVAL_QUERY" if task_type == "retrieval_query" else "RETRIEVAL_DOCUMENT",
                        }
                        for t in texts
                    ]
                }

                async with httpx.AsyncClient(timeout=30) as client:
                    res = await client.post(
                        url,
                        headers={"x-goog-api-key": key, "Content-Type": "application/json"},
                        json=body,
                    )
                res.raise_for_status()
                payload = res.json()

                embeddings = payload.get("embeddings") if isinstance(payload, dict) else None
                if not isinstance(embeddings, list) or not embeddings:
                    raise RuntimeError("Missing embeddings in batch response")

                out: List[List[float]] = []
                for emb in embeddings:
                    vec = None
                    if isinstance(emb, dict):
                        vec = emb.get("values") or emb.get("value") or emb.get("embedding")
                    if vec is None:
                        raise RuntimeError("Missing embedding values in batch item")
                    out.append(list(vec))

                logger.info(
                    "Batch embedding OK (key_index=%s/%s, model=%s, items=%s, vec_size=%s)",
                    idx + 1,
                    len(keys),
                    model_name,
                    len(out),
                    len(out[0]) if out else None,
                )
                return out
            except Exception as e:
                last_error = e
                logger.warning(
                    "Batch embedding failed (key_index=%s/%s, model=%s, error=%s): %s",
                    idx + 1,
                    len(keys),
                    model_name,
                    type(e).__name__,
                    e,
                )
                continue

    raise last_error or AIUnavailableError("all_embedding_keys_failed")


async def embed_text(text: str, task_type: EmbeddingTaskType) -> List[float]:
    """
    Return embedding vector for provided text.

    Tries all available Gemini API keys and embedding models with fallback.
    Note: google-generativeai is sync; run in a thread.
    """
    keys = _get_gemini_api_keys()
    if not keys:
        raise AIUnavailableError("missing_api_key")

    last_error: Exception | None = None

    for idx, key in enumerate(keys):
        for model_name in EMBEDDING_MODELS:
            try:
                genai.configure(api_key=key)

                def _embed(_model=model_name) -> List[float]:
                    result = genai.embed_content(
                        model=_model,
                        content=text,
                        task_type=task_type,
                    )
                    vec = result.get("embedding") if isinstance(result, dict) else getattr(result, "embedding", None)
                    if vec is None:
                        raise RuntimeError("Missing embedding in response")
                    return list(vec)

                vec = await asyncio.to_thread(_embed)
                logger.info(
                    "Embedding OK (key_index=%s/%s, model=%s, vec_size=%s)",
                    idx + 1, len(keys), model_name, len(vec),
                )
                return vec

            except Exception as e:
                last_error = e
                logger.warning(
                    "Embedding failed (key_index=%s/%s, model=%s, error=%s): %s",
                    idx + 1, len(keys), model_name, type(e).__name__, e,
                )
                continue

    raise last_error or AIUnavailableError("all_embedding_keys_failed")


async def embed_query(text: str) -> List[float]:
    return await embed_text(text=text, task_type="retrieval_query")


async def embed_document(text: str) -> List[float]:
    return await embed_text(text=text, task_type="retrieval_document")

