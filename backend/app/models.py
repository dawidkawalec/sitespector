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
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
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

    # Timestamps
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="audits")
    competitors = relationship("Competitor", back_populates="audit", cascade="all, delete-orphan")

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
