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
import logging
import uuid
from datetime import datetime
from typing import Any, AsyncGenerator, Dict, List, Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth_supabase import verify_workspace_access
from app.lib.supabase import get_workspace_subscription
from app.models import (
    AgentType,
    Audit,
    ChatConversation,
    ChatMessage,
    ChatMessageRole,
    ChatShare,
    ChatSharePermission,
    ChatUsage,
)
from app.services.ai_client import call_claude
from app.services.rag_service import retrieve_context

logger = logging.getLogger(__name__)


LIMITS_BY_TIER: Dict[str, Optional[int]] = {
    "free": 100,
    "pro": 500,
    "enterprise": None,  # unlimited
}


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
    q = select(AgentType).where(AgentType.is_system.is_(True))
    if workspace_id:
        q = q.union_all(
            select(AgentType).where(AgentType.workspace_id == _as_uuid(workspace_id), AgentType.is_system.is_(False))
        )
    res = await db.execute(q.order_by(AgentType.is_system.desc(), AgentType.name.asc()))
    return res.scalars().all()


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
        select(ChatMessage).where(ChatMessage.conversation_id == convo.id).order_by(ChatMessage.created_at.asc())
    )
    return convo, res.scalars().all()


async def update_conversation(
    db: AsyncSession,
    *,
    conversation_id: str,
    user_id: str,
    title: Optional[str],
    is_shared: Optional[bool],
) -> ChatConversation:
    convo = await get_conversation(db, conversation_id=conversation_id, user_id=user_id)
    if convo.created_by != _as_uuid(user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owner can update conversation")

    if title is not None:
        convo.title = title
    if is_shared is not None:
        convo.is_shared = bool(is_shared)

    await db.flush()
    await db.refresh(convo)
    return convo


async def delete_conversation(db: AsyncSession, *, conversation_id: str, user_id: str) -> None:
    convo = await get_conversation(db, conversation_id=conversation_id, user_id=user_id)
    if convo.created_by != _as_uuid(user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owner can delete conversation")
    await db.delete(convo)


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


def _build_prompt(
    *,
    agent: AgentType,
    rag_chunks: List[Dict[str, Any]],
    history: List[ChatMessage],
    user_message: str,
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
) -> AsyncGenerator[str, None]:
    """
    Server-side stream generator. Yields plain text chunks to be wrapped into SSE events by router.
    """
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

    # Auto-title on first message
    if not convo.title:
        convo.title = (user_message.strip()[:80] or "Nowa rozmowa")

    agent = convo.agent_type
    allowed_sections = list(agent.tools_config or [])

    rag_chunks = await retrieve_context(
        audit_id=str(convo.audit_id),
        query=user_message,
        allowed_sections=allowed_sections,
        top_k=8,
    )

    system_prompt, prompt = _build_prompt(
        agent=agent,
        rag_chunks=rag_chunks,
        history=history + [user_msg],
        user_message=user_message,
    )

    # For MVP reliability, call Gemini non-streaming and then stream to client in chunks.
    try:
        full = await call_claude(prompt=prompt, system_prompt=system_prompt, max_tokens=2048)
        full = (full or "").strip()
    except Exception as e:
        logger.warning("Chat LLM call failed (conversation_id=%s): %s", convo.id, e)
        full = (
            "AI jest chwilowo niedostepne. Sprobuj ponownie za chwile.\n\n"
            "Jesli problem sie powtarza, sprawdz konfiguracje Gemini na serwerze."
        )

    # Save assistant message
    assistant_msg = ChatMessage(
        conversation_id=convo.id,
        role=ChatMessageRole.ASSISTANT,
        content=full,
        tokens_used=None,
    )
    db.add(assistant_msg)

    await increment_usage(db, user_id=user_id)
    await db.flush()

    # Stream response in chunks
    chunk_size = 48
    for i in range(0, len(full), chunk_size):
        yield full[i : i + chunk_size]
        # Small await to cooperate with event loop; keeps UI responsive under load.
        await asyncio.sleep(0)

