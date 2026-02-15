"""
RAG indexing and retrieval for audit-scoped agent chat.

Source of truth:
- Audit results live in VPS Postgres `audits.results` (JSONB)
- Tasks live in `audit_tasks`

Vector store:
- Qdrant collection with points filtered strictly by `audit_id`
"""

from __future__ import annotations

import json
import logging
import uuid
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from qdrant_client.http import models as qmodels

from app.models import Audit, AuditTask
from app.services.embedding_client import embed_document, embed_query
from app.services.qdrant_client import (
    delete_points_by_filter,
    ensure_collection,
    search as qdrant_search,
    upsert_points,
)

logger = logging.getLogger(__name__)


QDRANT_COLLECTION = "audit_rag_chunks"


def _to_json(obj: Any) -> str:
    return json.dumps(obj, ensure_ascii=True, separators=(",", ":"), sort_keys=True, default=str)


def _batched(items: List[Any], batch_size: int) -> Iterable[List[Any]]:
    for i in range(0, len(items), batch_size):
        yield items[i : i + batch_size]


@dataclass
class RagChunk:
    section_type: str
    text: str
    meta: Dict[str, Any]


def _build_chunks_from_results(results: Dict[str, Any]) -> List[RagChunk]:
    chunks: List[RagChunk] = []

    crawl = results.get("crawl")
    if isinstance(crawl, dict):
        chunks.append(
            RagChunk(
                section_type="crawl_overview",
                text=_to_json(crawl),
                meta={"source": "results.crawl"},
            )
        )

    lighthouse = results.get("lighthouse")
    if isinstance(lighthouse, dict):
        desktop = lighthouse.get("desktop")
        mobile = lighthouse.get("mobile")
        if isinstance(desktop, dict):
            chunks.append(
                RagChunk(
                    section_type="lighthouse_desktop",
                    text=_to_json(desktop),
                    meta={"source": "results.lighthouse.desktop"},
                )
            )
        if isinstance(mobile, dict):
            chunks.append(
                RagChunk(
                    section_type="lighthouse_mobile",
                    text=_to_json(mobile),
                    meta={"source": "results.lighthouse.mobile"},
                )
            )

    content_analysis = results.get("content_analysis")
    if isinstance(content_analysis, dict):
        chunks.append(
            RagChunk(
                section_type="content_analysis",
                text=_to_json(content_analysis),
                meta={"source": "results.content_analysis"},
            )
        )

    performance_analysis = results.get("performance_analysis")
    if isinstance(performance_analysis, dict):
        chunks.append(
            RagChunk(
                section_type="performance_analysis",
                text=_to_json(performance_analysis),
                meta={"source": "results.performance_analysis"},
            )
        )

    local_seo = results.get("local_seo")
    if isinstance(local_seo, dict):
        chunks.append(
            RagChunk(
                section_type="local_seo",
                text=_to_json(local_seo),
                meta={"source": "results.local_seo"},
            )
        )

    competitive_analysis = results.get("competitive_analysis")
    if isinstance(competitive_analysis, dict):
        chunks.append(
            RagChunk(
                section_type="competitive_analysis",
                text=_to_json(competitive_analysis),
                meta={"source": "results.competitive_analysis"},
            )
        )

    # AI contexts, quick wins, executive summary, roadmap, cross_tool
    ai_contexts = results.get("ai_contexts")
    if isinstance(ai_contexts, dict):
        for key, val in ai_contexts.items():
            if not isinstance(val, (dict, list)):
                continue
            chunks.append(
                RagChunk(
                    section_type=f"ai_contexts_{key}",
                    text=_to_json(val),
                    meta={"source": f"results.ai_contexts.{key}"},
                )
            )

    for top_level_key in ["quick_wins", "executive_summary", "roadmap", "cross_tool"]:
        val = results.get(top_level_key)
        if isinstance(val, (dict, list)):
            chunks.append(
                RagChunk(
                    section_type=top_level_key,
                    text=_to_json(val),
                    meta={"source": f"results.{top_level_key}"},
                )
            )

    # Senuto (potentially huge)
    senuto = results.get("senuto")
    if isinstance(senuto, dict):
        visibility = senuto.get("visibility")
        if isinstance(visibility, dict):
            # Keep stats as one chunk
            stats = visibility.get("statistics")
            if isinstance(stats, dict):
                chunks.append(
                    RagChunk(
                        section_type="senuto_visibility",
                        text=_to_json({"statistics": stats}),
                        meta={"source": "results.senuto.visibility.statistics"},
                    )
                )

            # Positions/wins/losses can be huge - batch lists/dicts best-effort
            for list_key in ["positions", "wins", "losses"]:
                data = visibility.get(list_key)
                if isinstance(data, list) and data:
                    for idx, batch in enumerate(_batched(data, 150)):
                        chunks.append(
                            RagChunk(
                                section_type="senuto_visibility",
                                text=_to_json({list_key: batch}),
                                meta={"source": f"results.senuto.visibility.{list_key}", "batch": idx},
                            )
                        )

            aio = visibility.get("ai_overviews")
            if isinstance(aio, dict):
                chunks.append(
                    RagChunk(
                        section_type="senuto_ai_overviews",
                        text=_to_json(aio),
                        meta={"source": "results.senuto.visibility.ai_overviews"},
                    )
                )

        backlinks = senuto.get("backlinks")
        if isinstance(backlinks, dict):
            chunks.append(
                RagChunk(
                    section_type="senuto_backlinks",
                    text=_to_json(backlinks),
                    meta={"source": "results.senuto.backlinks"},
                )
            )

    # Links/images are stored in newer audits; best-effort if present.
    links = results.get("links")
    if isinstance(links, dict):
        chunks.append(
            RagChunk(
                section_type="links_internal",
                text=_to_json(links),
                meta={"source": "results.links"},
            )
        )

    images = results.get("images")
    if isinstance(images, dict):
        chunks.append(
            RagChunk(
                section_type="images",
                text=_to_json(images),
                meta={"source": "results.images"},
            )
        )

    return chunks


def _chunks_from_tasks(tasks: List[AuditTask]) -> List[RagChunk]:
    if not tasks:
        return []

    payload = [
        {
            "module": t.module,
            "title": t.title,
            "description": t.description,
            "category": t.category,
            "priority": getattr(t.priority, "value", str(t.priority)),
            "impact": t.impact,
            "effort": t.effort,
            "is_quick_win": t.is_quick_win,
            "status": getattr(t.status, "value", str(t.status)),
        }
        for t in tasks[:500]  # hard cap to avoid runaway token sizes
    ]

    chunks: List[RagChunk] = []
    for idx, batch in enumerate(_batched(payload, 100)):
        chunks.append(
            RagChunk(
                section_type="tasks",
                text=_to_json({"tasks": batch}),
                meta={"source": "audit_tasks", "batch": idx},
            )
        )
    return chunks


async def index_audit_for_rag(db: AsyncSession, audit_id: str) -> None:
    """
    Build chunks for a single audit and upsert them into Qdrant.

    Must be safe to run multiple times; it first deletes existing points for audit_id.
    """
    result = await db.execute(select(Audit).where(Audit.id == audit_id))
    audit = result.scalar_one_or_none()
    if not audit:
        raise ValueError(f"audit_not_found:{audit_id}")

    results_blob: Dict[str, Any] = audit.results or {}
    chunks = _build_chunks_from_results(results_blob)

    tasks_result = await db.execute(select(AuditTask).where(AuditTask.audit_id == audit.id).order_by(AuditTask.sort_order))
    tasks = tasks_result.scalars().all()
    chunks.extend(_chunks_from_tasks(tasks))

    if not chunks:
        logger.info("RAG: no chunks to index (audit_id=%s)", audit_id)
        return

    # Embed first chunk to determine vector size (model returns fixed size)
    first_vec = await embed_document(chunks[0].text)
    vector_size = len(first_vec)
    await ensure_collection(QDRANT_COLLECTION, vector_size=vector_size)

    audit_id_str = str(audit.id)
    await delete_points_by_filter(
        QDRANT_COLLECTION,
        qmodels.Filter(
            must=[qmodels.FieldCondition(key="audit_id", match=qmodels.MatchValue(value=audit_id_str))]
        ),
    )

    points: List[qmodels.PointStruct] = []

    # Upsert first point
    points.append(
        qmodels.PointStruct(
            id=str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{audit_id_str}:{chunks[0].section_type}:0")),
            vector=first_vec,
            payload={
                "audit_id": audit_id_str,
                "section_type": chunks[0].section_type,
                "chunk_index": 0,
                "text": chunks[0].text,
                "meta": chunks[0].meta,
            },
        )
    )

    # Remaining points
    for i, ch in enumerate(chunks[1:], start=1):
        vec = await embed_document(ch.text)
        points.append(
            qmodels.PointStruct(
                id=str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{audit_id_str}:{ch.section_type}:{i}")),
                vector=vec,
                payload={
                    "audit_id": audit_id_str,
                    "section_type": ch.section_type,
                    "chunk_index": i,
                    "text": ch.text,
                    "meta": ch.meta,
                },
            )
        )

    await upsert_points(QDRANT_COLLECTION, points)
    logger.info("RAG: indexed audit chunks (audit_id=%s, chunks=%s)", audit_id_str, len(points))


async def retrieve_context(
    *,
    audit_id: str,
    query: str,
    allowed_sections: List[str],
    top_k: int = 8,
) -> List[Dict[str, Any]]:
    """
    Retrieve top-k chunks filtered to the audit and allowed sections.
    """
    audit_id_str = str(audit_id)
    qvec = await embed_query(query)

    must_conditions: List[qmodels.FieldCondition] = [
        qmodels.FieldCondition(key="audit_id", match=qmodels.MatchValue(value=audit_id_str))
    ]

    if allowed_sections:
        must_conditions.append(
            qmodels.FieldCondition(
                key="section_type",
                match=qmodels.MatchAny(any=allowed_sections),
            )
        )

    flt = qmodels.Filter(must=must_conditions)
    scored = await qdrant_search(
        collection_name=QDRANT_COLLECTION,
        query_vector=qvec,
        flt=flt,
        limit=top_k,
    )

    out: List[Dict[str, Any]] = []
    for sp in scored:
        payload = sp.payload or {}
        out.append(
            {
                "score": sp.score,
                "section_type": payload.get("section_type"),
                "text": payload.get("text"),
                "meta": payload.get("meta") or {},
            }
        )
    return out

