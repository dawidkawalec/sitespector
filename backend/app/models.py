"""
SQLAlchemy models for SiteSpector database.
"""

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    Enum as SQLEnum,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class SubscriptionTier(str, enum.Enum):
    """User subscription tiers."""
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class AuditStatus(str, enum.Enum):
    """Audit processing status."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ScheduleFrequency(str, enum.Enum):
    """Frequency for scheduled audits."""
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class CompetitorStatus(str, enum.Enum):
    """Competitor analysis status."""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"


class TaskStatus(str, enum.Enum):
    """Task completion status."""
    PENDING = "pending"
    DONE = "done"


class TaskPriority(str, enum.Enum):
    """Task priority levels."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


def _enum_values(enum_cls):
    """Persist Enum values (not member names) to Postgres ENUM."""
    return [e.value for e in enum_cls]


class User(Base):
    """User model for authentication and subscription management."""

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    subscription_tier = Column(
        SQLEnum(SubscriptionTier),
        default=SubscriptionTier.FREE,
        nullable=False,
        index=True,
    )
    stripe_customer_id = Column(String(255), nullable=True)
    audits_count = Column(Integer, default=0, nullable=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    audits = relationship("Audit", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, tier={self.subscription_tier})>"


class Audit(Base):
    """Audit model for website analysis records."""

    __tablename__ = "audits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Legacy field: workspace-based audits no longer require user_id.
    # Keep nullable for backward compatibility with old user-owned audits.
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    workspace_id = Column(UUID(as_uuid=True), nullable=True, index=True)  # Added for multi-tenancy
    url = Column(String(2048), nullable=False)
    status = Column(
        SQLEnum(AuditStatus),
        default=AuditStatus.PENDING,
        nullable=False,
        index=True,
    )

    # Scores (0-100)
    overall_score = Column(Float, nullable=True)
    seo_score = Column(Float, nullable=True)
    performance_score = Column(Float, nullable=True)
    content_score = Column(Float, nullable=True)

    # Business type detection
    is_local_business = Column(Boolean, default=False, nullable=False)

    # Results stored as JSONB
    results = Column(JSONB, nullable=True)

    # PDF export
    pdf_url = Column(String(2048), nullable=True)

    # Processing step (for progress bar)
    processing_step = Column(String(100), nullable=True)

    # Error tracking
    error_message = Column(Text, nullable=True)

    # Processing logs (JSONB list of objects)
    processing_logs = Column(JSONB, nullable=True, default=list)

    # AI status (None, "processing", "completed", "failed")
    ai_status = Column(String(20), nullable=True)

    # Senuto configuration per audit
    senuto_country_id = Column(Integer, nullable=True, default=200)
    senuto_fetch_mode = Column(String(20), nullable=True, default="subdomain")

    # AI pipeline toggle
    run_ai_pipeline = Column(Boolean, default=True, nullable=False)

    # Execution plan toggle
    run_execution_plan = Column(Boolean, default=True, nullable=False)

    # Execution plan status (None, "processing", "completed", "failed")
    execution_plan_status = Column(String(20), nullable=True)

    # Timestamps
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="audits")
    competitors = relationship("Competitor", back_populates="audit", cascade="all, delete-orphan")
    tasks = relationship("AuditTask", back_populates="audit", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Audit(id={self.id}, url={self.url}, status={self.status})>"


class Competitor(Base):
    """Competitor model for competitive analysis."""

    __tablename__ = "competitors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    audit_id = Column(UUID(as_uuid=True), ForeignKey("audits.id"), nullable=False, index=True)
    url = Column(String(2048), nullable=False)
    status = Column(
        SQLEnum(CompetitorStatus),
        default=CompetitorStatus.PENDING,
        nullable=False,
    )

    # Results stored as JSONB
    results = Column(JSONB, nullable=True)

    # Timestamp
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    audit = relationship("Audit", back_populates="competitors")

    def __repr__(self) -> str:
        return f"<Competitor(id={self.id}, url={self.url}, status={self.status})>"


class AuditSchedule(Base):
    """Model for scheduling recurring audits."""

    __tablename__ = "audit_schedules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    workspace_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    url = Column(String(2048), nullable=False)
    frequency = Column(SQLEnum(ScheduleFrequency), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Configuration
    include_competitors = Column(Boolean, default=True)
    competitors_urls = Column(JSONB, nullable=True) # List of strings
    
    # Tracking
    last_run_at = Column(DateTime(timezone=True), nullable=True)
    next_run_at = Column(DateTime(timezone=True), nullable=True, index=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User")

    def __repr__(self) -> str:
        return f"<AuditSchedule(id={self.id}, url={self.url}, freq={self.frequency})>"


class ContactSubmission(Base):
    """Model for public contact form submissions."""

    __tablename__ = "contact_submissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    def __repr__(self) -> str:
        return f"<ContactSubmission(id={self.id}, email={self.email}, subject={self.subject})>"


class NewsletterSubscriber(Base):
    """Model for newsletter subscribers."""

    __tablename__ = "newsletter_subscribers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    subscribed_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    def __repr__(self) -> str:
        return f"<NewsletterSubscriber(id={self.id}, email={self.email}, active={self.is_active})>"


class AuditTask(Base):
    """Task model for execution plan items."""

    __tablename__ = "audit_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    audit_id = Column(UUID(as_uuid=True), ForeignKey("audits.id"), nullable=False, index=True)

    # Identity
    module = Column(String(50), nullable=False, index=True)  # seo|performance|visibility|ai_overviews|links|images|ux|security
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)

    # Classification
    category = Column(String(50), nullable=False)  # technical|content|offsite|ux|security
    # DB enum type `taskpriority` stores lowercase values; persist `.value` instead of `.name`.
    priority = Column(
        SQLEnum(TaskPriority, name="taskpriority", values_callable=_enum_values),
        nullable=False,
        index=True,
    )
    impact = Column(String(20), nullable=False)  # high|medium|low
    effort = Column(String(20), nullable=False)  # easy|medium|hard
    is_quick_win = Column(Boolean, default=False, nullable=False, index=True)

    # Concrete fix (AI-generated specifics)
    fix_data = Column(JSONB, nullable=True)  # {"current_value": "...", "suggested_value": "...", "code_snippet": "..."}

    # Interactive state
    # DB enum type `taskstatus` stores lowercase values; persist `.value` instead of `.name`.
    status = Column(
        SQLEnum(TaskStatus, name="taskstatus", values_callable=_enum_values),
        default=TaskStatus.PENDING,
        nullable=False,
        index=True,
    )
    notes = Column(Text, nullable=True)

    # Metadata
    source = Column(String(50), nullable=False)  # execution_plan|ai_context
    sort_order = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    audit = relationship("Audit", back_populates="tasks")

    def __repr__(self) -> str:
        return f"<AuditTask(id={self.id}, module={self.module}, title={self.title[:50]}, status={self.status})>"


# ============================================
# Chat / Agent Models (RAG Chat)
# ============================================

class ChatMessageRole(str, enum.Enum):
    """Chat message roles."""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ChatSharePermission(str, enum.Enum):
    """Sharing permission for a conversation."""
    READ = "read"
    WRITE = "write"


class AgentType(Base):
    """Predefined/custom agent definition (Cursor-like)."""

    __tablename__ = "agent_types"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Display
    name = Column(String(120), nullable=False)
    slug = Column(String(120), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    icon = Column(String(120), nullable=True)  # Lucide icon name (frontend)

    # Behavior
    system_prompt = Column(Text, nullable=False)
    tools_config = Column(JSONB, nullable=False, default=list)  # allowed RAG section types

    # Scope
    is_system = Column(Boolean, default=True, nullable=False, index=True)
    workspace_id = Column(UUID(as_uuid=True), nullable=True, index=True)  # null for system agents
    created_by = Column(UUID(as_uuid=True), nullable=True, index=True)  # Supabase user id (no FK)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    conversations = relationship("ChatConversation", back_populates="agent_type")

    def __repr__(self) -> str:
        return f"<AgentType(id={self.id}, slug={self.slug})>"


class ChatConversation(Base):
    """A single conversation thread within an audit, for a given agent."""

    __tablename__ = "chat_conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Scope / ownership
    workspace_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    audit_id = Column(UUID(as_uuid=True), ForeignKey("audits.id"), nullable=False, index=True)

    # Creator and agent config
    created_by = Column(UUID(as_uuid=True), nullable=False, index=True)  # Supabase user id (no FK)
    agent_type_id = Column(UUID(as_uuid=True), ForeignKey("agent_types.id"), nullable=False, index=True)

    # Metadata
    title = Column(String(300), nullable=True)
    is_shared = Column(Boolean, default=False, nullable=False, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    agent_type = relationship("AgentType", back_populates="conversations")
    audit = relationship("Audit")  # no backref needed right now
    messages = relationship("ChatMessage", back_populates="conversation", cascade="all, delete-orphan")
    shares = relationship("ChatShare", back_populates="conversation", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<ChatConversation(id={self.id}, audit_id={self.audit_id}, agent_type_id={self.agent_type_id})>"


class ChatMessage(Base):
    """Message inside a conversation."""

    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(
        UUID(as_uuid=True),
        ForeignKey("chat_conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    role = Column(
        SQLEnum(ChatMessageRole, name="chatmessagerole", values_callable=_enum_values),
        nullable=False,
        index=True,
    )
    content = Column(Text, nullable=False)
    tokens_used = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    conversation = relationship("ChatConversation", back_populates="messages")

    def __repr__(self) -> str:
        return f"<ChatMessage(id={self.id}, role={self.role})>"


class ChatShare(Base):
    """Share a conversation with another user in the workspace."""

    __tablename__ = "chat_shares"
    __table_args__ = (
        UniqueConstraint("conversation_id", "shared_with_user_id", name="uq_chat_share_conversation_user"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(
        UUID(as_uuid=True),
        ForeignKey("chat_conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    shared_with_user_id = Column(UUID(as_uuid=True), nullable=False, index=True)  # Supabase user id
    shared_by_user_id = Column(UUID(as_uuid=True), nullable=False, index=True)  # Supabase user id

    permission = Column(
        SQLEnum(ChatSharePermission, name="chatsharepermission", values_callable=_enum_values),
        default=ChatSharePermission.READ,
        nullable=False,
        index=True,
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    conversation = relationship("ChatConversation", back_populates="shares")

    def __repr__(self) -> str:
        return f"<ChatShare(id={self.id}, conversation_id={self.conversation_id})>"


class ChatUsage(Base):
    """Monthly message counters for rate limiting (per user)."""

    __tablename__ = "chat_usage"
    __table_args__ = (
        UniqueConstraint("user_id", "month", name="uq_chat_usage_user_month"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)  # Supabase user id
    month = Column(String(7), nullable=False, index=True)  # YYYY-MM
    messages_sent = Column(Integer, default=0, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self) -> str:
        return f"<ChatUsage(user_id={self.user_id}, month={self.month}, messages_sent={self.messages_sent})>"
