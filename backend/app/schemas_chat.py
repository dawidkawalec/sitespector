"""
Pydantic schemas for chat/agent endpoints.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.models import ChatMessageRole, ChatSharePermission


class AgentTypeResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    sort_order: int = 0
    system_prompt: Optional[str] = None
    tools_config: List[str] = Field(default_factory=list)
    is_system: bool
    workspace_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AgentTypeCreateRequest(BaseModel):
    workspace_id: UUID
    name: str = Field(..., min_length=2, max_length=120)
    description: Optional[str] = Field(default=None, max_length=2000)
    icon: Optional[str] = Field(default=None, max_length=120)
    system_prompt: str = Field(..., min_length=20, max_length=20000)
    tools_config: List[str] = Field(default_factory=list)
    sort_order: Optional[int] = None


class AgentTypeUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=120)
    description: Optional[str] = Field(default=None, max_length=2000)
    icon: Optional[str] = Field(default=None, max_length=120)
    system_prompt: Optional[str] = Field(default=None, min_length=20, max_length=20000)
    tools_config: Optional[List[str]] = None
    sort_order: Optional[int] = None


class AgentOrderItem(BaseModel):
    id: UUID
    sort_order: int


class AgentOrderUpdateRequest(BaseModel):
    workspace_id: UUID
    items: List[AgentOrderItem] = Field(default_factory=list)


class ChatConversationCreateRequest(BaseModel):
    audit_id: UUID
    workspace_id: UUID
    agent_slug: str = Field(..., min_length=2, max_length=120)


class ChatConversationUpdateRequest(BaseModel):
    title: Optional[str] = Field(default=None, max_length=300)
    is_shared: Optional[bool] = None
    verbosity: Optional[str] = Field(default=None, max_length=20)
    tone: Optional[str] = Field(default=None, max_length=20)


class ChatConversationResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    audit_id: UUID
    created_by: UUID
    agent_type_id: UUID
    title: Optional[str] = None
    is_shared: bool
    verbosity: str
    tone: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChatMessageCreateRequest(BaseModel):
    content: str = Field(default="", max_length=20000)
    attachment_ids: List[UUID] = Field(default_factory=list)


class ChatAttachmentResponse(BaseModel):
    id: UUID
    filename: str
    mime_type: str
    size_bytes: int
    created_at: datetime

    class Config:
        from_attributes = True


class ChatMessageResponse(BaseModel):
    id: UUID
    conversation_id: UUID
    role: ChatMessageRole
    content: str
    tokens_used: Optional[int] = None
    created_at: datetime
    attachments: List[ChatAttachmentResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True


class ChatConversationWithMessagesResponse(BaseModel):
    conversation: ChatConversationResponse
    agent: AgentTypeResponse
    messages: List[ChatMessageResponse]


class ChatMessageFeedbackRequest(BaseModel):
    rating: int = Field(..., description="+1 or -1")


class ChatShareCreateRequest(BaseModel):
    shared_with_user_id: UUID
    permission: ChatSharePermission = ChatSharePermission.READ


class ChatShareResponse(BaseModel):
    id: UUID
    conversation_id: UUID
    shared_with_user_id: UUID
    shared_by_user_id: UUID
    permission: ChatSharePermission
    created_at: datetime

    class Config:
        from_attributes = True


class ChatUsageResponse(BaseModel):
    month: str
    messages_sent: int
    limit: Optional[int] = None  # null = unlimited
    subscription_tier: Optional[str] = None


class ErrorResponse(BaseModel):
    detail: str
    meta: Optional[Dict[str, Any]] = None

