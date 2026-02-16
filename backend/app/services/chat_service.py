"""
Chat service for audit-scoped agent conversations.

Responsibilities:
- Conversation CRUD
- Message persistence
- Sharing
- Rate limiting (monthly)
- Building prompts with RAG context
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, AsyncGenerator, Dict, List, Optional, Tuple

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth_supabase import verify_workspace_access
from app.lib.supabase import get_workspace_subscription
from app.models import (
    AgentType,
    Audit,
    ChatAttachment,
    ChatConversation,
    ChatMessage,
    ChatMessageFeedback,
    ChatMessageRole,
    ChatShare,
    ChatSharePermission,
    ChatUsage,
)
from app.services.ai_client import call_claude, stream_gemini
from app.services.rag_service import retrieve_context
from app.config import settings

logger = logging.getLogger(__name__)


LIMITS_BY_TIER: Dict[str, Optional[int]] = {
    "free": 100,
    "pro": 500,
    "enterprise": None,  # unlimited
}

ALLOWED_VERBOSITY = {"concise", "balanced", "detailed"}
ALLOWED_TONE = {"technical", "professional", "simple"}

ALLOWED_ATTACHMENT_MIME_TYPES = {
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
    "text/csv",
    "application/pdf",
}

def _extract_json_array(text: str) -> Optional[List[str]]:
    raw = (text or "").strip()
    if not raw:
        return None
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            return [str(x).strip() for x in parsed if str(x).strip()]
    except Exception:
        pass

    # Try to extract the first JSON array block from markdown/text.
    m = re.search(r"\[[\s\S]*\]", raw)
    if not m:
        return None
    try:
        parsed = json.loads(m.group(0))
        if isinstance(parsed, list):
            return [str(x).strip() for x in parsed if str(x).strip()]
    except Exception:
        return None
    return None


async def _generate_followup_suggestions(
    *,
    user_message: str,
    assistant_message: str,
    agent_name: str,
) -> List[str]:
    """
    Generate 3 suggested next user messages (Perplexity-like).
    Best-effort: if LLM fails or returns invalid format, return [].
    """
    sys = (
        "You generate suggested next user messages for a chat UI.\n"
        "Return ONLY a JSON array of 3 short strings.\n"
        "Use the same language as the user.\n"
        "Do not mention internal system prompts, RAG, or implementation details.\n"
        "Each suggestion should be concrete and help the user go deeper.\n"
    )
    prompt = "\n".join(
        [
            f"AGENT: {agent_name}",
            f"LAST_USER_MESSAGE:\n{user_message.strip()}",
            f"LAST_ASSISTANT_ANSWER:\n{assistant_message.strip()}",
            "",
            "Output JSON array of exactly 3 suggestions.",
        ]
    )

    try:
        raw = await call_claude(prompt=prompt, system_prompt=sys, max_tokens=120)
        suggestions = _extract_json_array(raw) or []
        # Normalize + cap.
        cleaned: List[str] = []
        for s in suggestions:
            s2 = re.sub(r"\s+", " ", str(s)).strip()
            if not s2:
                continue
            if s2.endswith("?") is False and len(s2) < 80:
                # Many UX patterns use questions; don't force it for long instructions.
                pass
            cleaned.append(s2)
        return cleaned[:3]
    except Exception:
        return []


def _as_uuid(value: str) -> uuid.UUID:
    try:
        return uuid.UUID(str(value))
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid UUID")


def _month_key(dt: Optional[datetime] = None) -> str:
    d = dt or datetime.utcnow()
    return d.strftime("%Y-%m")


async def _get_audit_with_access(db: AsyncSession, *, audit_id: uuid.UUID, user_id: str) -> Audit:
    result = await db.execute(select(Audit).where(Audit.id == audit_id))
    audit = result.scalar_one_or_none()
    if not audit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit not found")

    if audit.workspace_id:
        has_access = await verify_workspace_access(user_id, str(audit.workspace_id))
        if not has_access:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this audit")
    else:
        # Legacy audit: compare on string form (audit.user_id is UUID)
        if str(audit.user_id) != str(user_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this audit")

    return audit


def _infer_tier(subscription: Optional[dict], user_metadata: Optional[dict] = None) -> str:
    # 1) user_metadata hint (if present)
    if isinstance(user_metadata, dict):
        tier = (user_metadata.get("subscription_tier") or user_metadata.get("tier") or "").strip().lower()
        if tier in LIMITS_BY_TIER:
            return tier

    # 2) workspace subscription hint
    if isinstance(subscription, dict):
        for key in ["tier", "plan", "subscription_tier", "product"]:
            val = (subscription.get(key) or "").strip().lower()
            if val in LIMITS_BY_TIER:
                return val

    return "free"


async def get_usage(db: AsyncSession, *, user_id: str, workspace_id: str, user_metadata: Optional[dict]) -> Tuple[str, int, Optional[int], str]:
    month = _month_key()
    user_uuid = _as_uuid(user_id)

    subscription = await get_workspace_subscription(workspace_id)
    tier = _infer_tier(subscription, user_metadata=user_metadata)
    limit = LIMITS_BY_TIER.get(tier, LIMITS_BY_TIER["free"])

    res = await db.execute(select(ChatUsage).where(ChatUsage.user_id == user_uuid, ChatUsage.month == month))
    usage = res.scalar_one_or_none()
    sent = usage.messages_sent if usage else 0
    return month, sent, limit, tier


async def assert_rate_limit(db: AsyncSession, *, user_id: str, workspace_id: str, user_metadata: Optional[dict]) -> None:
    month, sent, limit, _tier = await get_usage(
        db, user_id=user_id, workspace_id=workspace_id, user_metadata=user_metadata
    )
    if limit is None:
        return
    if sent >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Monthly chat limit reached ({sent}/{limit})",
        )


async def increment_usage(db: AsyncSession, *, user_id: str) -> None:
    month = _month_key()
    user_uuid = _as_uuid(user_id)

    res = await db.execute(select(ChatUsage).where(ChatUsage.user_id == user_uuid, ChatUsage.month == month))
    usage = res.scalar_one_or_none()
    if not usage:
        usage = ChatUsage(user_id=user_uuid, month=month, messages_sent=0)
        db.add(usage)
        await db.flush()

    usage.messages_sent = int(usage.messages_sent or 0) + 1


async def list_agents(db: AsyncSession, *, workspace_id: Optional[str] = None) -> List[AgentType]:
    from sqlalchemy import or_

    conditions = [AgentType.is_system.is_(True)]
    if workspace_id:
        conditions.append(AgentType.workspace_id == _as_uuid(workspace_id))

    q = (
        select(AgentType)
        .where(or_(*conditions))
        .order_by(AgentType.is_system.desc(), AgentType.sort_order.asc(), AgentType.name.asc())
    )
    res = await db.execute(q)
    return list(res.scalars().all())


def _slugify(value: str) -> str:
    v = (value or "").strip().lower()
    v = re.sub(r"[^a-z0-9]+", "-", v)
    v = re.sub(r"-{2,}", "-", v).strip("-")
    return v or "agent"


async def create_custom_agent(
    db: AsyncSession,
    *,
    workspace_id: str,
    user_id: str,
    name: str,
    description: Optional[str],
    icon: Optional[str],
    system_prompt: str,
    tools_config: List[str],
    sort_order: Optional[int] = None,
) -> AgentType:
    ws_uuid = _as_uuid(workspace_id)
    user_uuid = _as_uuid(user_id)

    if sort_order is None:
        res = await db.execute(
            select(func.coalesce(func.max(AgentType.sort_order), 0)).where(
                AgentType.is_system.is_(False),
                AgentType.workspace_id == ws_uuid,
            )
        )
        sort_order = int(res.scalar_one() or 0) + 1

    slug_base = _slugify(name)
    slug = f"{slug_base}-{str(uuid.uuid4())[:8]}"

    agent = AgentType(
        name=name.strip(),
        slug=slug,
        description=description,
        icon=icon,
        system_prompt=system_prompt,
        tools_config=list(tools_config or []),
        is_system=False,
        workspace_id=ws_uuid,
        created_by=user_uuid,
        sort_order=int(sort_order or 0),
    )
    db.add(agent)
    await db.flush()
    await db.refresh(agent)
    return agent


async def update_custom_agent(
    db: AsyncSession,
    *,
    agent_id: str,
    workspace_id: str,
    user_id: str,
    name: Optional[str] = None,
    description: Optional[str] = None,
    icon: Optional[str] = None,
    system_prompt: Optional[str] = None,
    tools_config: Optional[List[str]] = None,
    sort_order: Optional[int] = None,
) -> AgentType:
    agent_uuid = _as_uuid(agent_id)
    ws_uuid = _as_uuid(workspace_id)
    user_uuid = _as_uuid(user_id)

    res = await db.execute(select(AgentType).where(AgentType.id == agent_uuid))
    agent = res.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")
    if agent.is_system:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="System agents cannot be edited")
    if agent.workspace_id != ws_uuid:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Agent not available in this workspace")
    if agent.created_by != user_uuid:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only creator can edit agent")

    if name is not None:
        agent.name = name.strip()
    if description is not None:
        agent.description = description
    if icon is not None:
        agent.icon = icon
    if system_prompt is not None:
        agent.system_prompt = system_prompt
    if tools_config is not None:
        agent.tools_config = list(tools_config or [])
    if sort_order is not None:
        agent.sort_order = int(sort_order)

    await db.flush()
    await db.refresh(agent)
    return agent


async def delete_custom_agent(
    db: AsyncSession,
    *,
    agent_id: str,
    workspace_id: str,
    user_id: str,
) -> None:
    agent_uuid = _as_uuid(agent_id)
    ws_uuid = _as_uuid(workspace_id)
    user_uuid = _as_uuid(user_id)

    res = await db.execute(select(AgentType).where(AgentType.id == agent_uuid))
    agent = res.scalar_one_or_none()
    if not agent:
        return
    if agent.is_system:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="System agents cannot be deleted")
    if agent.workspace_id != ws_uuid:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Agent not available in this workspace")
    if agent.created_by != user_uuid:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only creator can delete agent")

    await db.delete(agent)


async def update_custom_agent_order(
    db: AsyncSession,
    *,
    workspace_id: str,
    user_id: str,
    items: List[Dict[str, Any]],
) -> None:
    ws_uuid = _as_uuid(workspace_id)
    user_uuid = _as_uuid(user_id)

    # Only affects custom agents for this workspace; system agents remain global.
    for it in items:
        agent_id = it.get("id")
        sort_order = it.get("sort_order")
        if not agent_id:
            continue
        await db.execute(
            update(AgentType)
            .where(
                AgentType.id == _as_uuid(str(agent_id)),
                AgentType.is_system.is_(False),
                AgentType.workspace_id == ws_uuid,
                AgentType.created_by == user_uuid,
            )
            .values(sort_order=int(sort_order))
        )


def _safe_filename(name: str) -> str:
    # Keep ASCII-ish and avoid path traversal.
    base = os.path.basename(name or "file")
    base = base.replace("\x00", "")
    return base[:255] or "file"


async def create_attachment(
    db: AsyncSession,
    *,
    conversation_id: str,
    user_id: str,
    upload: UploadFile,
) -> ChatAttachment:
    convo = await get_conversation(db, conversation_id=conversation_id, user_id=user_id)
    user_uuid = _as_uuid(user_id)

    mime = (upload.content_type or "").strip().lower()
    if mime not in ALLOWED_ATTACHMENT_MIME_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file type")

    max_bytes = int(getattr(settings, "CHAT_ATTACHMENT_MAX_SIZE_MB", 10) or 10) * 1024 * 1024

    base_dir = Path(settings.CHAT_ATTACHMENTS_PATH).resolve()
    rel_dir = Path(str(convo.workspace_id)) / str(convo.id)
    target_dir = (base_dir / rel_dir).resolve()
    if base_dir not in target_dir.parents and base_dir != target_dir:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Invalid storage path")

    target_dir.mkdir(parents=True, exist_ok=True)

    filename = _safe_filename(upload.filename or "file")
    suffix = Path(filename).suffix
    disk_name = f"{uuid.uuid4()}{suffix}"
    rel_path = str(rel_dir / disk_name)
    full_path = (base_dir / rel_path).resolve()

    size = 0
    with full_path.open("wb") as f:
        while True:
            chunk = await upload.read(1024 * 1024)
            if not chunk:
                break
            size += len(chunk)
            if size > max_bytes:
                try:
                    f.close()
                    full_path.unlink(missing_ok=True)
                except Exception:
                    pass
                raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File too large")
            f.write(chunk)

    attachment = ChatAttachment(
        conversation_id=convo.id,
        message_id=None,
        workspace_id=convo.workspace_id,
        uploaded_by=user_uuid,
        filename=filename,
        mime_type=mime,
        size_bytes=size,
        storage_path=rel_path,
    )
    db.add(attachment)
    await db.flush()
    await db.refresh(attachment)
    return attachment


async def get_attachment_file_response(db: AsyncSession, *, attachment_id: str, user_id: str):
    from fastapi.responses import FileResponse

    att_uuid = _as_uuid(attachment_id)
    res = await db.execute(select(ChatAttachment).where(ChatAttachment.id == att_uuid))
    att = res.scalar_one_or_none()
    if not att:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attachment not found")

    # Reuse existing conversation access rules (workspace membership + share logic)
    _ = await get_conversation(db, conversation_id=str(att.conversation_id), user_id=user_id)

    base_dir = Path(settings.CHAT_ATTACHMENTS_PATH).resolve()
    full_path = (base_dir / str(att.storage_path)).resolve()
    if base_dir not in full_path.parents and base_dir != full_path:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Invalid storage path")
    if not full_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File missing on disk")

    return FileResponse(
        path=str(full_path),
        media_type=att.mime_type,
        filename=att.filename,
    )


async def get_agent_by_slug(db: AsyncSession, *, slug: str, workspace_id: Optional[str] = None) -> AgentType:
    res = await db.execute(select(AgentType).where(AgentType.slug == slug))
    agent = res.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")
    if not agent.is_system and workspace_id and str(agent.workspace_id) != str(workspace_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Agent not available in this workspace")
    return agent


async def create_conversation(
    db: AsyncSession,
    *,
    audit_id: str,
    workspace_id: str,
    agent_slug: str,
    user_id: str,
    user_metadata: Optional[dict],
) -> ChatConversation:
    # Verify workspace membership (explicit)
    has_access = await verify_workspace_access(user_id, workspace_id)
    if not has_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this workspace")

    audit_uuid = _as_uuid(audit_id)
    audit = await _get_audit_with_access(db, audit_id=audit_uuid, user_id=user_id)
    if audit.workspace_id and str(audit.workspace_id) != str(workspace_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="workspace_id does not match audit")

    agent = await get_agent_by_slug(db, slug=agent_slug, workspace_id=workspace_id)

    convo = ChatConversation(
        workspace_id=_as_uuid(workspace_id),
        audit_id=audit.id,
        created_by=_as_uuid(user_id),
        agent_type_id=agent.id,
        title=None,
        is_shared=False,
    )
    db.add(convo)
    await db.flush()
    await db.refresh(convo)
    return convo


async def list_conversations(
    db: AsyncSession,
    *,
    user_id: str,
    workspace_id: str,
    audit_id: Optional[str] = None,
    agent_slug: Optional[str] = None,
) -> List[ChatConversation]:
    # Must be in workspace to list
    has_access = await verify_workspace_access(user_id, workspace_id)
    if not has_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this workspace")

    q = select(ChatConversation).options(selectinload(ChatConversation.agent_type)).where(
        ChatConversation.workspace_id == _as_uuid(workspace_id)
    )
    if audit_id:
        q = q.where(ChatConversation.audit_id == _as_uuid(audit_id))
    if agent_slug:
        agent = await get_agent_by_slug(db, slug=agent_slug, workspace_id=workspace_id)
        q = q.where(ChatConversation.agent_type_id == agent.id)

    # Include:
    # - conversations created by user
    # - conversations shared to the whole workspace (is_shared)
    # - conversations explicitly shared to the user
    # For MVP: simple OR.
    user_uuid = _as_uuid(user_id)
    q = q.outerjoin(ChatShare, ChatShare.conversation_id == ChatConversation.id).where(
        (ChatConversation.created_by == user_uuid)
        | (ChatConversation.is_shared.is_(True))
        | (ChatShare.shared_with_user_id == user_uuid)
    )

    res = await db.execute(q.order_by(ChatConversation.updated_at.desc()))
    return res.scalars().unique().all()


async def get_conversation(
    db: AsyncSession,
    *,
    conversation_id: str,
    user_id: str,
    workspace_id: Optional[str] = None,
) -> ChatConversation:
    convo_uuid = _as_uuid(conversation_id)
    res = await db.execute(
        select(ChatConversation)
        .options(selectinload(ChatConversation.agent_type))
        .where(ChatConversation.id == convo_uuid)
    )
    convo = res.scalar_one_or_none()
    if not convo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    if workspace_id and str(convo.workspace_id) != str(workspace_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    # Access rules: creator, shared workspace, or explicit share.
    user_uuid = _as_uuid(user_id)
    if convo.created_by == user_uuid or convo.is_shared:
        # still require workspace membership
        has_access = await verify_workspace_access(user_id, str(convo.workspace_id))
        if not has_access:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        return convo

    share_res = await db.execute(
        select(ChatShare).where(
            ChatShare.conversation_id == convo.id,
            ChatShare.shared_with_user_id == user_uuid,
        )
    )
    if not share_res.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return convo


async def get_conversation_messages(
    db: AsyncSession,
    *,
    conversation_id: str,
    user_id: str,
) -> Tuple[ChatConversation, List[ChatMessage]]:
    convo = await get_conversation(db, conversation_id=conversation_id, user_id=user_id)
    res = await db.execute(
        select(ChatMessage)
        .options(selectinload(ChatMessage.attachments))
        .where(ChatMessage.conversation_id == convo.id)
        .order_by(ChatMessage.created_at.asc())
    )
    return convo, res.scalars().all()


async def update_conversation(
    db: AsyncSession,
    *,
    conversation_id: str,
    user_id: str,
    title: Optional[str],
    is_shared: Optional[bool],
    verbosity: Optional[str] = None,
    tone: Optional[str] = None,
) -> ChatConversation:
    convo = await get_conversation(db, conversation_id=conversation_id, user_id=user_id)
    if convo.created_by != _as_uuid(user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owner can update conversation")

    if title is not None:
        convo.title = title
    if is_shared is not None:
        convo.is_shared = bool(is_shared)
    if verbosity is not None:
        v = str(verbosity).strip().lower()
        if v not in ALLOWED_VERBOSITY:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verbosity")
        convo.verbosity = v
    if tone is not None:
        t = str(tone).strip().lower()
        if t not in ALLOWED_TONE:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid tone")
        convo.tone = t

    await db.flush()
    await db.refresh(convo)
    return convo


async def delete_conversation(db: AsyncSession, *, conversation_id: str, user_id: str) -> None:
    convo = await get_conversation(db, conversation_id=conversation_id, user_id=user_id)
    if convo.created_by != _as_uuid(user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owner can delete conversation")
    await db.delete(convo)


async def set_message_feedback(
    db: AsyncSession,
    *,
    message_id: str,
    user_id: str,
    rating: int,
) -> None:
    if int(rating) not in (-1, 1):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid rating")

    msg_uuid = _as_uuid(message_id)
    user_uuid = _as_uuid(user_id)

    res = await db.execute(select(ChatMessage).where(ChatMessage.id == msg_uuid))
    msg = res.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    # Permission: must be able to access the parent conversation.
    _ = await get_conversation(db, conversation_id=str(msg.conversation_id), user_id=user_id)

    fb_res = await db.execute(
        select(ChatMessageFeedback).where(
            ChatMessageFeedback.message_id == msg_uuid,
            ChatMessageFeedback.user_id == user_uuid,
        )
    )
    fb = fb_res.scalar_one_or_none()
    if fb:
        fb.rating = int(rating)
    else:
        db.add(ChatMessageFeedback(message_id=msg_uuid, user_id=user_uuid, rating=int(rating)))


async def share_conversation(
    db: AsyncSession,
    *,
    conversation_id: str,
    user_id: str,
    shared_with_user_id: str,
    permission: ChatSharePermission,
) -> ChatShare:
    convo = await get_conversation(db, conversation_id=conversation_id, user_id=user_id)
    if convo.created_by != _as_uuid(user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owner can share conversation")

    share = ChatShare(
        conversation_id=convo.id,
        shared_with_user_id=_as_uuid(shared_with_user_id),
        shared_by_user_id=_as_uuid(user_id),
        permission=permission,
    )
    db.add(share)
    await db.flush()
    await db.refresh(share)
    return share


async def revoke_share(db: AsyncSession, *, conversation_id: str, user_id: str, shared_with_user_id: str) -> None:
    convo = await get_conversation(db, conversation_id=conversation_id, user_id=user_id)
    if convo.created_by != _as_uuid(user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owner can revoke share")

    res = await db.execute(
        select(ChatShare).where(
            ChatShare.conversation_id == convo.id,
            ChatShare.shared_with_user_id == _as_uuid(shared_with_user_id),
        )
    )
    share = res.scalar_one_or_none()
    if not share:
        return
    await db.delete(share)


def _style_instructions(*, verbosity: str, tone: str) -> List[str]:
    lines: List[str] = []

    v = (verbosity or "balanced").strip().lower()
    t = (tone or "professional").strip().lower()

    if v == "concise":
        lines.append("- Keep answers short (2-4 sentences) unless user asks for details.")
        lines.append("- Prefer bullet points; avoid long introductions.")
    elif v == "detailed":
        lines.append("- Provide a thorough answer with reasoning and concrete steps.")
        lines.append("- Add examples when helpful; use sections and bullet points.")
    else:
        lines.append("- Keep answers clear and actionable; avoid unnecessary verbosity.")

    if t == "technical":
        lines.append("- Use technical vocabulary when relevant (metrics, headers, HTTP codes).")
        lines.append("- Assume the user is advanced; be precise.")
    elif t == "simple":
        lines.append("- Explain in simple terms; avoid jargon where possible.")
        lines.append("- Use short sentences and practical examples.")
    else:
        lines.append("- Keep a professional tone and practical explanations.")

    return lines


def _build_prompt(
    *,
    agent: AgentType,
    rag_chunks: List[Dict[str, Any]],
    history: List[ChatMessage],
    user_message: str,
    verbosity: str = "balanced",
    tone: str = "professional",
) -> Tuple[str, str]:
    """
    Returns (system_prompt, user_prompt) for the LLM call.
    """
    # Keep history compact: last 20 messages
    hist = history[-20:]
    history_lines: List[str] = []
    for msg in hist:
        role = msg.role.value if hasattr(msg.role, "value") else str(msg.role)
        history_lines.append(f"{role.upper()}: {msg.content}")

    ctx_lines: List[str] = []
    for i, ch in enumerate(rag_chunks):
        ctx_lines.append(
            f"[{i+1}] section={ch.get('section_type')} score={ch.get('score')}\n{ch.get('text')}\n"
        )

    system_prompt = agent.system_prompt.strip()
    style_lines = _style_instructions(verbosity=verbosity, tone=tone)
    if style_lines:
        system_prompt = "\n".join([system_prompt, "", "STYLE:", *style_lines]).strip()
    user_prompt = "\n".join(
        [
            "CONTEXT (audit-scoped; do not use external knowledge unless explicitly asked):",
            *ctx_lines,
            "HISTORY:",
            *history_lines,
            "",
            f"USER: {user_message}",
            "",
            "INSTRUCTIONS:",
            "- If data is missing in CONTEXT, say 'brak danych w raporcie'.",
            "- Provide concrete, actionable next steps.",
            "- Prefer bullet points and short paragraphs.",
        ]
    ).strip()

    return system_prompt, user_prompt


async def stream_chat_response(
    db: AsyncSession,
    *,
    conversation_id: str,
    user_id: str,
    user_message: str,
    user_metadata: Optional[dict],
    attachment_ids: Optional[List[uuid.UUID]] = None,
) -> AsyncGenerator[str, None]:
    """
    Server-side stream generator. Yields plain text chunks to be wrapped into SSE events by router.
    """
    if (user_message or "").strip() == "" and not (attachment_ids or []):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message cannot be empty")
    convo, history = await get_conversation_messages(db, conversation_id=conversation_id, user_id=user_id)

    # Rate limit based on workspace subscription tier
    await assert_rate_limit(db, user_id=user_id, workspace_id=str(convo.workspace_id), user_metadata=user_metadata)

    # Save user message
    user_msg = ChatMessage(
        conversation_id=convo.id,
        role=ChatMessageRole.USER,
        content=user_message,
        tokens_used=None,
    )
    db.add(user_msg)
    await db.flush()

    # Link uploaded attachments to this message (best-effort).
    if attachment_ids:
        user_uuid = _as_uuid(user_id)
        ids = [_as_uuid(str(aid)) for aid in attachment_ids]
        await db.execute(
            update(ChatAttachment)
            .where(
                ChatAttachment.id.in_(ids),
                ChatAttachment.conversation_id == convo.id,
                ChatAttachment.uploaded_by == user_uuid,
                ChatAttachment.message_id.is_(None),
            )
            .values(message_id=user_msg.id)
        )

    # Auto-title on first message
    if not convo.title:
        convo.title = (user_message.strip()[:80] or "Nowa rozmowa")

    agent = convo.agent_type
    allowed_sections = list(agent.tools_config or [])

    # Phase: searching context
    yield "__STATUS__:searching"

    rag_chunks = await retrieve_context(
        audit_id=str(convo.audit_id),
        query=user_message,
        allowed_sections=allowed_sections,
        top_k=12,
    )

    system_prompt, prompt = _build_prompt(
        agent=agent,
        rag_chunks=rag_chunks,
        history=history + [user_msg],
        user_message=user_message,
        verbosity=getattr(convo, "verbosity", "balanced") or "balanced",
        tone=getattr(convo, "tone", "professional") or "professional",
    )

    # Phase: generating response
    yield "__STATUS__:generating"

    # Phase: streaming response
    yield "__STATUS__:streaming"

    # Build multimodal attachments for Gemini (images as Blob, other files via Files API upload).
    gemini_attachments: List[Dict[str, Any]] = []
    if attachment_ids:
        att_res = await db.execute(
            select(ChatAttachment)
            .where(ChatAttachment.message_id == user_msg.id)
            .order_by(ChatAttachment.created_at.asc())
        )
        atts = list(att_res.scalars().all())
        base_dir = Path(settings.CHAT_ATTACHMENTS_PATH).resolve()
        for att in atts:
            full_path = (base_dir / str(att.storage_path)).resolve()
            if not full_path.exists():
                continue
            if (att.mime_type or "").startswith("image/"):
                try:
                    gemini_attachments.append(
                        {
                            "kind": "image",
                            "mime_type": att.mime_type,
                            "filename": att.filename,
                            "data": full_path.read_bytes(),
                        }
                    )
                except Exception:
                    continue
            else:
                gemini_attachments.append(
                    {
                        "kind": "file",
                        "mime_type": att.mime_type,
                        "filename": att.filename,
                        "path": str(full_path),
                    }
                )

    # True streaming: forward model deltas to SSE while accumulating full response for persistence.
    full_parts: List[str] = []
    try:
        async for delta in stream_gemini(
            prompt=prompt,
            system_prompt=system_prompt,
            max_tokens=2048,
            attachments=gemini_attachments or None,
        ):
            full_parts.append(delta)
            yield delta
    except Exception as e:
        logger.warning("Chat LLM streaming failed (conversation_id=%s): %s", convo.id, e)
        # Fallback to non-streaming call, then chunk to the client.
        try:
            full = await call_claude(
                prompt=prompt,
                system_prompt=system_prompt,
                max_tokens=2048,
                attachments=gemini_attachments or None,
            )
            full = (full or "").strip()
        except Exception as e2:
            logger.warning("Chat LLM call failed (conversation_id=%s): %s", convo.id, e2)
            full = (
                "AI jest chwilowo niedostepne. Sprobuj ponownie za chwile.\n\n"
                "Jesli problem sie powtarza, sprawdz konfiguracje Gemini na serwerze."
            )
        chunk_size = 64
        for i in range(0, len(full), chunk_size):
            part = full[i : i + chunk_size]
            full_parts.append(part)
            yield part
            await asyncio.sleep(0)

    full_text = ("".join(full_parts) or "").strip()

    # Save assistant message after streaming completes.
    assistant_msg = ChatMessage(
        conversation_id=convo.id,
        role=ChatMessageRole.ASSISTANT,
        content=full_text,
        tokens_used=None,
    )
    db.add(assistant_msg)

    await increment_usage(db, user_id=user_id)
    await db.flush()

    # Suggested follow-up prompts (best-effort, emitted after the answer).
    suggestions = await _generate_followup_suggestions(
        user_message=user_message,
        assistant_message=full_text,
        agent_name=getattr(agent, "name", "Agent"),
    )
    if suggestions:
        yield "__SUGGESTIONS__:" + json.dumps(suggestions)

