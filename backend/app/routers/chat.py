"""
Chat endpoints: agent chat scoped to a single audit report.

Auth: Supabase JWT (via app.auth_supabase.get_current_user)
"""

from __future__ import annotations

import json
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth_supabase import get_current_user, verify_workspace_access
from app.database import get_db
from app.schemas_chat import (
    AgentTypeResponse,
    AgentTypeCreateRequest,
    AgentTypeUpdateRequest,
    AgentOrderUpdateRequest,
    ChatConversationCreateRequest,
    ChatConversationResponse,
    ChatConversationUpdateRequest,
    ChatConversationWithMessagesResponse,
    ChatMessageCreateRequest,
    ChatMessageResponse,
    ChatShareCreateRequest,
    ChatShareResponse,
    ChatUsageResponse,
    ChatAttachmentResponse,
    ChatMessageFeedbackRequest,
)
from app.services import chat_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.get("/agents", response_model=list[AgentTypeResponse])
async def list_agents(
    workspace_id: str | None = Query(default=None),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Workspace filtering is optional; system agents are always returned.
    agents = await chat_service.list_agents(db, workspace_id=workspace_id)
    return agents


@router.post("/agents", response_model=AgentTypeResponse, status_code=status.HTTP_201_CREATED)
async def create_agent(
    body: AgentTypeCreateRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    has_access = await verify_workspace_access(current_user["id"], str(body.workspace_id))
    if not has_access:
        # Keep message generic (do not leak workspace existence)
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    agent = await chat_service.create_custom_agent(
        db,
        workspace_id=str(body.workspace_id),
        user_id=current_user["id"],
        name=body.name,
        description=body.description,
        icon=body.icon,
        system_prompt=body.system_prompt,
        tools_config=body.tools_config,
        sort_order=body.sort_order,
    )
    return agent


@router.put("/agents/{agent_id}", response_model=AgentTypeResponse)
async def update_agent(
    agent_id: UUID,
    body: AgentTypeUpdateRequest,
    workspace_id: str = Query(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    has_access = await verify_workspace_access(current_user["id"], str(workspace_id))
    if not has_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    agent = await chat_service.update_custom_agent(
        db,
        agent_id=str(agent_id),
        workspace_id=str(workspace_id),
        user_id=current_user["id"],
        name=body.name,
        description=body.description,
        icon=body.icon,
        system_prompt=body.system_prompt,
        tools_config=body.tools_config,
        sort_order=body.sort_order,
    )
    return agent


@router.delete("/agents/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agent(
    agent_id: UUID,
    workspace_id: str = Query(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    has_access = await verify_workspace_access(current_user["id"], str(workspace_id))
    if not has_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    await chat_service.delete_custom_agent(
        db, agent_id=str(agent_id), workspace_id=str(workspace_id), user_id=current_user["id"]
    )
    return None


@router.patch("/agents/order", status_code=status.HTTP_204_NO_CONTENT)
async def update_agents_order(
    body: AgentOrderUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    has_access = await verify_workspace_access(current_user["id"], str(body.workspace_id))
    if not has_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    items: list[dict] = []
    for it in body.items:
        if hasattr(it, "model_dump"):
            items.append(it.model_dump())
        else:
            items.append(it.dict())
    await chat_service.update_custom_agent_order(
        db,
        workspace_id=str(body.workspace_id),
        user_id=current_user["id"],
        items=items,
    )
    return None


@router.post("/attachments/upload", response_model=ChatAttachmentResponse, status_code=status.HTTP_201_CREATED)
async def upload_chat_attachment(
    conversation_id: UUID = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    attachment = await chat_service.create_attachment(
        db,
        conversation_id=str(conversation_id),
        user_id=current_user["id"],
        upload=file,
    )
    return attachment


@router.get("/attachments/{attachment_id}")
async def download_chat_attachment(
    attachment_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await chat_service.get_attachment_file_response(
        db, attachment_id=str(attachment_id), user_id=current_user["id"]
    )


@router.post("/messages/{message_id}/feedback", status_code=status.HTTP_204_NO_CONTENT)
async def leave_message_feedback(
    message_id: UUID,
    body: ChatMessageFeedbackRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await chat_service.set_message_feedback(
        db,
        message_id=str(message_id),
        user_id=current_user["id"],
        rating=body.rating,
    )
    return None


@router.post(
    "/conversations",
    response_model=ChatConversationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_conversation(
    body: ChatConversationCreateRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    convo = await chat_service.create_conversation(
        db,
        audit_id=str(body.audit_id),
        workspace_id=str(body.workspace_id),
        agent_slug=body.agent_slug,
        user_id=current_user["id"],
        user_metadata=current_user.get("user_metadata"),
    )
    return convo


@router.get("/conversations", response_model=list[ChatConversationResponse])
async def list_conversations(
    workspace_id: str = Query(...),
    audit_id: str | None = Query(default=None),
    agent_slug: str | None = Query(default=None),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    convos = await chat_service.list_conversations(
        db,
        user_id=current_user["id"],
        workspace_id=workspace_id,
        audit_id=audit_id,
        agent_slug=agent_slug,
    )
    return convos


@router.get("/conversations/{conversation_id}", response_model=ChatConversationWithMessagesResponse)
async def get_conversation(
    conversation_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    convo, messages = await chat_service.get_conversation_messages(
        db,
        conversation_id=str(conversation_id),
        user_id=current_user["id"],
    )
    return {
        "conversation": convo,
        "agent": convo.agent_type,
        "messages": messages,
    }


@router.patch("/conversations/{conversation_id}", response_model=ChatConversationResponse)
async def update_conversation(
    conversation_id: UUID,
    body: ChatConversationUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    convo = await chat_service.update_conversation(
        db,
        conversation_id=str(conversation_id),
        user_id=current_user["id"],
        title=body.title,
        is_shared=body.is_shared,
        verbosity=body.verbosity,
        tone=body.tone,
    )
    return convo


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await chat_service.delete_conversation(db, conversation_id=str(conversation_id), user_id=current_user["id"])
    return None


@router.post("/conversations/{conversation_id}/share", response_model=ChatShareResponse, status_code=status.HTTP_201_CREATED)
async def share_conversation(
    conversation_id: UUID,
    body: ChatShareCreateRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    share = await chat_service.share_conversation(
        db,
        conversation_id=str(conversation_id),
        user_id=current_user["id"],
        shared_with_user_id=str(body.shared_with_user_id),
        permission=body.permission,
    )
    return share


@router.delete(
    "/conversations/{conversation_id}/share/{shared_with_user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def revoke_share(
    conversation_id: UUID,
    shared_with_user_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await chat_service.revoke_share(
        db,
        conversation_id=str(conversation_id),
        user_id=current_user["id"],
        shared_with_user_id=str(shared_with_user_id),
    )
    return None


@router.get("/usage", response_model=ChatUsageResponse)
async def get_usage(
    workspace_id: str = Query(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    month, sent, limit, tier = await chat_service.get_usage(
        db,
        user_id=current_user["id"],
        workspace_id=workspace_id,
        user_metadata=current_user.get("user_metadata"),
    )
    return {"month": month, "messages_sent": sent, "limit": limit, "subscription_tier": tier}


@router.post("/conversations/{conversation_id}/messages/stream", response_model=None)
async def stream_message(
    conversation_id: UUID,
    body: ChatMessageCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Send a message and stream assistant response using SSE (POST + Authorization header).

    IMPORTANT: We create a dedicated DB session inside the generator because
    FastAPI closes Depends(get_db) sessions before the SSE stream finishes,
    causing "connection is closed" errors.

    SSE format:
      data: {"token":"..."}\n\n
      data: [DONE]\n\n
    """
    from app.database import AsyncSessionLocal

    user_id = current_user["id"]
    user_message = body.content
    user_metadata = current_user.get("user_metadata")
    convo_id = str(conversation_id)

    async def event_generator():
        async with AsyncSessionLocal() as db:
            try:
                async for chunk in chat_service.stream_chat_response(
                    db,
                    conversation_id=convo_id,
                    user_id=user_id,
                    user_message=user_message,
                    user_metadata=user_metadata,
                    attachment_ids=body.attachment_ids,
                ):
                    if chunk.startswith("__STATUS__:"):
                        status = chunk.split(":", 1)[1]
                        yield f"data: {json.dumps({'status': status})}\n\n"
                    elif chunk.startswith("__SUGGESTIONS__:"):
                        payload = chunk.split(":", 1)[1]
                        try:
                            suggestions = json.loads(payload)
                            yield f"data: {json.dumps({'suggestions': suggestions})}\n\n"
                        except Exception:
                            # Ignore invalid suggestions payloads
                            pass
                    else:
                        yield f"data: {json.dumps({'token': chunk})}\n\n"
                await db.commit()
                yield "data: [DONE]\n\n"
            except Exception as e:
                logger.error("Chat SSE stream failed (conversation_id=%s): %s", conversation_id, e)
                try:
                    await db.rollback()
                except Exception:
                    pass
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

