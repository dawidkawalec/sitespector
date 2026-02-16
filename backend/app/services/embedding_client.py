"""
Gemini embeddings client used by the RAG subsystem.

Provider: Google Generative AI (google-generativeai)
Model: models/gemini-embedding-001
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, List, Literal

import httpx

import google.generativeai as genai

from app.services.ai_client import _get_gemini_api_keys, AIUnavailableError

logger = logging.getLogger(__name__)

_BATCH_EMBED_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents"

EmbeddingTaskType = Literal["retrieval_query", "retrieval_document"]


EMBEDDING_MODELS = [
    "models/gemini-embedding-001",
]

_TASK_TYPE_TO_API: Dict[EmbeddingTaskType, str] = {
    "retrieval_query": "RETRIEVAL_QUERY",
    "retrieval_document": "RETRIEVAL_DOCUMENT",
}


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
    async with httpx.AsyncClient(timeout=60.0) as client:
        for idx, key in enumerate(keys):
            try:
                resp = await client.post(
                    _BATCH_EMBED_URL,
                    headers={
                        "x-goog-api-key": key,
                        "Content-Type": "application/json",
                    },
                    json={"requests": requests},
                )
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
                    "Batch embedding failed (key_index=%s/%s, texts=%s, error=%s): %s",
                    idx + 1,
                    len(keys),
                    len(texts),
                    type(e).__name__,
                    e,
                )

    raise last_error or AIUnavailableError("all_embedding_keys_failed")


async def embed_query(text: str) -> List[float]:
    return await embed_text(text=text, task_type="retrieval_query")


async def embed_document(text: str) -> List[float]:
    return await embed_text(text=text, task_type="retrieval_document")

