"""
Gemini embeddings client used by the RAG subsystem.

Provider: Google Generative AI (google-generativeai)
Model: models/gemini-embedding-001
"""

from __future__ import annotations

import asyncio
import logging
import random
from typing import Any, Dict, List, Literal

import httpx

import google.generativeai as genai

from app.services.ai_client import _get_gemini_api_keys, AIUnavailableError

logger = logging.getLogger(__name__)

_BATCH_EMBED_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents"

# Global semaphore to avoid stampeding the embedding endpoint.
_EMBED_SEMA = asyncio.Semaphore(2)

EmbeddingTaskType = Literal["retrieval_query", "retrieval_document"]


EMBEDDING_MODELS = [
    "models/gemini-embedding-001",
]

_TASK_TYPE_TO_API: Dict[EmbeddingTaskType, str] = {
    "retrieval_query": "RETRIEVAL_QUERY",
    "retrieval_document": "RETRIEVAL_DOCUMENT",
}

def _is_quota_error(exc: Exception) -> bool:
    msg = str(exc)
    return (
        "ResourceExhausted" in msg
        or "exceeded your current quota" in msg
        or "quota_exhausted" in msg
        or "429" in msg
        or "rate limits" in msg.lower()
    )


async def _backoff_sleep(attempt: int, retry_after_seconds: float | None = None) -> None:
    # Prefer server-provided hint when available.
    if retry_after_seconds is not None and retry_after_seconds > 0:
        await asyncio.sleep(min(60.0, retry_after_seconds))
        return
    # Exponential backoff with small jitter.
    base = min(30.0, 0.5 * (2**attempt))
    await asyncio.sleep(base + random.random() * 0.25)


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

    async with _EMBED_SEMA:
        for idx, key in enumerate(keys):
            for model_name in EMBEDDING_MODELS:
                for attempt in range(0, 3):
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
                            "Embedding failed (key_index=%s/%s, model=%s, attempt=%s, error=%s): %s",
                            idx + 1,
                            len(keys),
                            model_name,
                            attempt + 1,
                            type(e).__name__,
                            e,
                        )
                        if _is_quota_error(e) and attempt < 2:
                            await _backoff_sleep(attempt)
                            continue
                        break

    raise last_error or AIUnavailableError("all_embedding_keys_failed")


async def embed_texts_batch(
    texts: List[str],
    task_type: EmbeddingTaskType,
) -> List[List[float]]:
    """
    Embed multiple texts in a single request via REST `batchEmbedContents`.

    This drastically reduces request count vs calling `embed_content()` per chunk, which helps
    avoid 429 quota errors during large audit indexing.
    """
    if not texts:
        return []

    keys = _get_gemini_api_keys()
    if not keys:
        raise AIUnavailableError("missing_api_key")

    task_type_api = _TASK_TYPE_TO_API[task_type]
    requests: List[Dict[str, Any]] = []
    for t in texts:
        requests.append(
            {
                "model": "models/gemini-embedding-001",
                "content": {"parts": [{"text": t}]},
                "taskType": task_type_api,
            }
        )

    last_error: Exception | None = None
    async with _EMBED_SEMA:
        async with httpx.AsyncClient(timeout=60.0) as client:
            for idx, key in enumerate(keys):
                for attempt in range(0, 3):
                    try:
                        resp = await client.post(
                            _BATCH_EMBED_URL,
                            headers={
                                "x-goog-api-key": key,
                                "Content-Type": "application/json",
                            },
                            json={"requests": requests},
                        )

                        if resp.status_code == 429:
                            retry_after: float | None = None
                            ra = (resp.headers.get("retry-after") or "").strip()
                            if ra.isdigit():
                                retry_after = float(ra)
                            if attempt < 2:
                                await _backoff_sleep(attempt, retry_after_seconds=retry_after)
                                continue
                            raise AIUnavailableError("quota_exhausted_429")

                        resp.raise_for_status()
                        data = resp.json()
                        embeddings = data.get("embeddings")
                        if not isinstance(embeddings, list) or len(embeddings) != len(texts):
                            raise RuntimeError(
                                f"Invalid batch embedding response (embeddings={type(embeddings).__name__}, "
                                f"count={len(embeddings) if isinstance(embeddings, list) else 'n/a'}, expected={len(texts)})"
                            )

                        vectors: List[List[float]] = []
                        for emb in embeddings:
                            values = emb.get("values") if isinstance(emb, dict) else None
                            if not isinstance(values, list):
                                raise RuntimeError("Invalid embedding payload (missing values[])")
                            vectors.append([float(x) for x in values])

                        logger.info(
                            "Batch embedding OK (key_index=%s/%s, texts=%s, vec_size=%s)",
                            idx + 1,
                            len(keys),
                            len(texts),
                            len(vectors[0]) if vectors else 0,
                        )
                        return vectors
                    except Exception as e:
                        last_error = e
                        logger.warning(
                            "Batch embedding failed (key_index=%s/%s, texts=%s, attempt=%s, error=%s): %s",
                            idx + 1,
                            len(keys),
                            len(texts),
                            attempt + 1,
                            type(e).__name__,
                            e,
                        )
                        if _is_quota_error(e) and attempt < 2:
                            await _backoff_sleep(attempt)
                            continue
                        break

    raise last_error or AIUnavailableError("all_embedding_keys_failed")


async def embed_query(text: str) -> List[float]:
    return await embed_text(text=text, task_type="retrieval_query")


async def embed_document(text: str) -> List[float]:
    return await embed_text(text=text, task_type="retrieval_document")

