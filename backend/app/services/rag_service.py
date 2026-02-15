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

    # ── AI contexts: smart semantic chunking per area ──────────────
    ai_contexts = results.get("ai_contexts")
    if isinstance(ai_contexts, dict):
        chunks.extend(_smart_chunk_ai_contexts(ai_contexts))

    # ── Executive summary ────────────────────────────────────────
    exec_summary = results.get("executive_summary")
    if isinstance(exec_summary, dict):
        chunks.extend(_smart_chunk_executive_summary(exec_summary))

    # ── Roadmap: each phase → separate chunks per item ───────────
    roadmap = results.get("roadmap")
    if isinstance(roadmap, dict):
        chunks.extend(_smart_chunk_roadmap(roadmap))

    # ── Cross-tool analysis ──────────────────────────────────────
    cross_tool = results.get("cross_tool")
    if isinstance(cross_tool, dict):
        chunks.extend(_smart_chunk_cross_tool(cross_tool))

    # ── Quick wins: each item as its own chunk ───────────────────
    quick_wins = results.get("quick_wins")
    if isinstance(quick_wins, list) and quick_wins:
        chunks.extend(_smart_chunk_quick_wins(quick_wins))

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


# ────────────────────────────────────────────────────────────────────
# Smart semantic chunking for AI-generated analyses
# ────────────────────────────────────────────────────────────────────

_AI_CONTEXT_LIST_FIELDS = ["key_findings", "recommendations", "quick_wins", "priority_issues"]


def _smart_chunk_ai_contexts(ai_contexts: Dict[str, Any]) -> List[RagChunk]:
    """
    Chunk each AI context area (seo, performance, visibility, ...) into
    individual findings/recommendations so the agent can retrieve the
    exact item that matches a user question like "point 2 from SEO analysis".
    """
    chunks: List[RagChunk] = []
    for area_key, area_val in ai_contexts.items():
        if not isinstance(area_val, dict):
            continue

        for field in _AI_CONTEXT_LIST_FIELDS:
            items = area_val.get(field)
            if not isinstance(items, list) or not items:
                continue
            for idx, item in enumerate(items):
                item_text = item if isinstance(item, str) else _to_json(item)
                readable = (
                    f"[Analiza AI — {area_key}] {field.replace('_', ' ').title()} "
                    f"#{idx + 1}: {item_text}"
                )
                chunks.append(
                    RagChunk(
                        section_type=f"ai_contexts_{area_key}",
                        text=readable,
                        meta={
                            "source": f"results.ai_contexts.{area_key}.{field}",
                            "area": area_key,
                            "field": field,
                            "item_index": idx,
                        },
                    )
                )

        remaining = {
            k: v for k, v in area_val.items()
            if k not in _AI_CONTEXT_LIST_FIELDS and k != "_meta"
        }
        if remaining:
            chunks.append(
                RagChunk(
                    section_type=f"ai_contexts_{area_key}",
                    text=f"[Analiza AI — {area_key}] Dodatkowe dane: {_to_json(remaining)}",
                    meta={"source": f"results.ai_contexts.{area_key}", "field": "extra"},
                )
            )
    return chunks


def _smart_chunk_executive_summary(summary: Dict[str, Any]) -> List[RagChunk]:
    """Executive summary → one chunk for summary text, separate chunks for strengths/issues."""
    chunks: List[RagChunk] = []

    core_text = summary.get("summary", "")
    health = summary.get("overall_health", "")
    score = summary.get("health_score", "")
    growth = summary.get("growth_potential", "")
    impact = summary.get("estimated_impact", "")

    if core_text or health:
        readable = (
            f"[Executive Summary] Ogolna ocena: {health} ({score}/100). "
            f"{core_text} "
            f"Potencjal wzrostu: {growth}. "
            f"Szacowany wplyw: {impact}."
        )
        chunks.append(
            RagChunk(
                section_type="executive_summary",
                text=readable,
                meta={"source": "results.executive_summary", "field": "core"},
            )
        )

    for field in ["strengths", "critical_issues"]:
        items = summary.get(field)
        if not isinstance(items, list):
            continue
        for idx, item in enumerate(items):
            item_text = item if isinstance(item, str) else _to_json(item)
            label = "Mocna strona" if field == "strengths" else "Krytyczny problem"
            chunks.append(
                RagChunk(
                    section_type="executive_summary",
                    text=f"[Executive Summary] {label} #{idx + 1}: {item_text}",
                    meta={
                        "source": f"results.executive_summary.{field}",
                        "field": field,
                        "item_index": idx,
                    },
                )
            )
    return chunks


def _smart_chunk_roadmap(roadmap: Dict[str, Any]) -> List[RagChunk]:
    """Roadmap → each action item as its own chunk with phase metadata."""
    chunks: List[RagChunk] = []
    phase_labels = {
        "immediate_actions": "Natychmiastowe dzialania",
        "short_term": "Krotkoterminowe (1-3 mies.)",
        "medium_term": "Srednoterminowe (3-6 mies.)",
        "long_term": "Dlugoterminowe (6-12 mies.)",
    }
    for phase_key, phase_label in phase_labels.items():
        items = roadmap.get(phase_key)
        if not isinstance(items, list):
            continue
        for idx, item in enumerate(items):
            if isinstance(item, dict):
                title = item.get("title", "")
                desc = item.get("description", "")
                impact = item.get("impact", "")
                area = item.get("area", "")
                readable = (
                    f"[Roadmapa — {phase_label}] Punkt #{idx + 1}: {title}. "
                    f"{desc} (Wplyw: {impact}, Obszar: {area})"
                )
            else:
                readable = f"[Roadmapa — {phase_label}] Punkt #{idx + 1}: {item}"
            chunks.append(
                RagChunk(
                    section_type="roadmap",
                    text=readable,
                    meta={
                        "source": f"results.roadmap.{phase_key}",
                        "phase": phase_key,
                        "phase_label": phase_label,
                        "item_index": idx,
                    },
                )
            )
    return chunks


def _smart_chunk_cross_tool(cross_tool: Dict[str, Any]) -> List[RagChunk]:
    """Cross-tool analysis → separate chunks for correlations, synergies, conflicts, recommendations."""
    chunks: List[RagChunk] = []
    field_labels = {
        "correlations": "Korelacja",
        "synergies": "Synergia",
        "conflicts": "Konflikt",
        "unified_recommendations": "Rekomendacja (cross-tool)",
    }
    for field, label in field_labels.items():
        items = cross_tool.get(field)
        if not isinstance(items, list):
            continue
        for idx, item in enumerate(items):
            item_text = item if isinstance(item, str) else _to_json(item)
            chunks.append(
                RagChunk(
                    section_type="cross_tool",
                    text=f"[Analiza Cross-Tool] {label} #{idx + 1}: {item_text}",
                    meta={
                        "source": f"results.cross_tool.{field}",
                        "field": field,
                        "item_index": idx,
                    },
                )
            )
    return chunks


def _smart_chunk_quick_wins(quick_wins: List[Any]) -> List[RagChunk]:
    """Quick wins → each item as its own chunk."""
    chunks: List[RagChunk] = []
    for idx, item in enumerate(quick_wins):
        if isinstance(item, dict):
            title = item.get("title", "")
            desc = item.get("description", "")
            impact = item.get("impact", "")
            effort = item.get("effort", "")
            area = item.get("area", item.get("module", ""))
            readable = (
                f"[Quick Win #{idx + 1}] {title}. "
                f"{desc} (Wplyw: {impact}, Naklad: {effort}, Obszar: {area})"
            )
        else:
            readable = f"[Quick Win #{idx + 1}] {item}"
        chunks.append(
            RagChunk(
                section_type="quick_wins",
                text=readable,
                meta={
                    "source": "results.quick_wins",
                    "item_index": idx,
                },
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

