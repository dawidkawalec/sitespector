"""
Qdrant client wrapper used by the RAG subsystem.

We keep it synchronous internally (qdrant-client is sync) and provide async
helpers via asyncio.to_thread to avoid blocking the event loop.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, List, Optional

from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels

from app.config import settings

logger = logging.getLogger(__name__)


_client: Optional[QdrantClient] = None


def get_qdrant_client() -> QdrantClient:
    global _client
    if _client is not None:
        return _client

    if (settings.QDRANT_URL or "").strip():
        _client = QdrantClient(url=settings.QDRANT_URL.strip(), timeout=120)
    else:
        _client = QdrantClient(host=settings.QDRANT_HOST, port=int(settings.QDRANT_PORT), timeout=120)
    return _client


async def ensure_collection(
    collection_name: str,
    vector_size: int,
    distance: qmodels.Distance = qmodels.Distance.COSINE,
) -> None:
    client = get_qdrant_client()

    def _ensure() -> None:
        """
        Ensure Qdrant collection exists and matches expected vector size.

        Qdrant collection vector size is immutable. If an older collection was created with a
        different embedding model dimension, indexing/search will fail. In that case we recreate.
        """
        try:
            col = client.get_collection(collection_name)
            vectors = col.config.params.vectors

            current_size: int | None = None
            if hasattr(vectors, "size"):
                current_size = int(getattr(vectors, "size"))
            elif isinstance(vectors, dict):
                # Named vectors. Use the first one as the "default" size.
                for _, v in vectors.items():
                    if hasattr(v, "size"):
                        current_size = int(getattr(v, "size"))
                        break
                    if isinstance(v, dict) and "size" in v:
                        current_size = int(v["size"])
                        break

            if current_size is not None and current_size != int(vector_size):
                logger.warning(
                    "Qdrant collection vector size mismatch (collection=%s, current=%s, expected=%s) - recreating",
                    collection_name,
                    current_size,
                    vector_size,
                )
                client.delete_collection(collection_name=collection_name)
                client.create_collection(
                    collection_name=collection_name,
                    vectors_config=qmodels.VectorParams(size=vector_size, distance=distance),
                )
            return
        except Exception:
            # Fall back to create below (either missing collection or unknown response shape).
            pass

        client.create_collection(
            collection_name=collection_name,
            vectors_config=qmodels.VectorParams(size=vector_size, distance=distance),
        )

    await asyncio.to_thread(_ensure)


async def delete_points_by_filter(collection_name: str, flt: qmodels.Filter) -> None:
    client = get_qdrant_client()

    def _delete() -> None:
        client.delete(
            collection_name=collection_name,
            points_selector=qmodels.FilterSelector(filter=flt),
            wait=True,
        )

    await asyncio.to_thread(_delete)


async def upsert_points(
    collection_name: str,
    points: List[qmodels.PointStruct],
    batch_size: int = 50,
) -> None:
    """Upsert points in batches to avoid timeouts on large payloads."""
    client = get_qdrant_client()

    if not points:
        return

    for i in range(0, len(points), batch_size):
        batch = points[i : i + batch_size]

        def _upsert(b: List[qmodels.PointStruct] = batch) -> None:
            client.upsert(collection_name=collection_name, points=b, wait=True)

        await asyncio.to_thread(_upsert)


async def search(
    collection_name: str,
    query_vector: List[float],
    flt: Optional[qmodels.Filter] = None,
    limit: int = 8,
) -> List[qmodels.ScoredPoint]:
    client = get_qdrant_client()

    def _search() -> List[qmodels.ScoredPoint]:
        return client.search(
            collection_name=collection_name,
            query_vector=query_vector,
            query_filter=flt,
            limit=limit,
            with_payload=True,
        )

    return await asyncio.to_thread(_search)

