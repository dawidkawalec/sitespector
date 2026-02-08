"""
Pydantic schemas for request/response validation.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, validator
from app.models import SubscriptionTier, AuditStatus, CompetitorStatus, ScheduleFrequency


# ============================================
# Audit Schedule Schemas
# ============================================

class AuditScheduleBase(BaseModel):
    """Base audit schedule schema."""
    url: str = Field(..., max_length=2048)
    frequency: ScheduleFrequency
    include_competitors: bool = True
    competitors_urls: List[str] = Field(default=[], max_items=3)

    @validator("url")
    def validate_url(cls, v: str) -> str:
        if not v.startswith(("http://", "https://")):
            v = f"https://{v}"
        return v

    @validator("competitors_urls")
    def validate_competitors(cls, v: List[str]) -> List[str]:
        validated = []
        for url in v:
            if not url.startswith(("http://", "https://")):
                url = f"https://{url}"
            validated.append(url)
        return validated


class AuditScheduleCreate(AuditScheduleBase):
    """Schema for creating audit schedule."""
    workspace_id: UUID


class AuditScheduleUpdate(BaseModel):
    """Schema for updating audit schedule."""
    frequency: Optional[ScheduleFrequency] = None
    is_active: Optional[bool] = None
    include_competitors: Optional[bool] = None
    competitors_urls: Optional[List[str]] = None


class AuditScheduleResponse(AuditScheduleBase):
    """Schema for audit schedule response."""
    id: UUID
    user_id: UUID
    workspace_id: UUID
    is_active: bool
    last_run_at: Optional[datetime] = None
    next_run_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================
# User Schemas
# ============================================

class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr


class UserCreate(UserBase):
    """Schema for user registration."""
    password: str = Field(..., min_length=8, max_length=100)

    @validator("password")
    def validate_password(cls, v: str) -> str:
        """Validate password strength."""
        if not any(char.isdigit() for char in v):
            raise ValueError("Password must contain at least one digit")
        if not any(char.isupper() for char in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(char.islower() for char in v):
            raise ValueError("Password must contain at least one lowercase letter")
        return v


class UserLogin(UserBase):
    """Schema for user login."""
    password: str


class UserResponse(UserBase):
    """Schema for user response."""
    id: UUID
    subscription_tier: SubscriptionTier
    audits_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """Schema for user update."""
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8, max_length=100)


# ============================================
# Authentication Schemas
# ============================================

class Token(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema for token payload data."""
    user_id: str
    email: str


# ============================================
# Competitor Schemas
# ============================================

class CompetitorBase(BaseModel):
    """Base competitor schema."""
    url: str = Field(..., max_length=2048)


class CompetitorCreate(CompetitorBase):
    """Schema for creating competitor."""
    pass


class CompetitorResponse(CompetitorBase):
    """Schema for competitor response."""
    id: UUID
    audit_id: UUID
    status: CompetitorStatus
    results: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================
# Audit Schemas
# ============================================

class AuditBase(BaseModel):
    """Base audit schema."""
    url: str = Field(..., max_length=2048)

    @validator("url")
    def validate_url(cls, v: str) -> str:
        """Validate URL format."""
        if not v.startswith(("http://", "https://")):
            v = f"https://{v}"
        return v


class AuditCreate(AuditBase):
    """Schema for creating audit."""
    competitors: List[str] = Field(
        default=[],
        max_items=3,
        description="Up to 3 competitor URLs"
    )

    @validator("competitors")
    def validate_competitors(cls, v: List[str]) -> List[str]:
        """Validate competitor URLs."""
        validated = []
        for url in v:
            if not url.startswith(("http://", "https://")):
                url = f"https://{url}"
            validated.append(url)
        return validated


class AuditUpdate(BaseModel):
    """Schema for updating audit."""
    status: Optional[AuditStatus] = None
    overall_score: Optional[float] = Field(None, ge=0, le=100)
    seo_score: Optional[float] = Field(None, ge=0, le=100)
    performance_score: Optional[float] = Field(None, ge=0, le=100)
    content_score: Optional[float] = Field(None, ge=0, le=100)
    is_local_business: Optional[bool] = None
    results: Optional[Dict[str, Any]] = None
    pdf_url: Optional[str] = None
    error_message: Optional[str] = None


class AuditResponse(AuditBase):
    """Schema for audit response."""
    id: UUID
    user_id: Optional[UUID] = None
    workspace_id: Optional[UUID] = None
    status: AuditStatus
    overall_score: Optional[float] = None
    seo_score: Optional[float] = None
    performance_score: Optional[float] = None
    content_score: Optional[float] = None
    is_local_business: bool
    results: Optional[Dict[str, Any]] = None
    pdf_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    competitors: List[CompetitorResponse] = []

    class Config:
        from_attributes = True


class FixSuggestionRequest(BaseModel):
    """Request for AI fix suggestion."""
    issue_type: str
    urls: List[str]


class FixSuggestionResponse(BaseModel):
    """Response for AI fix suggestion."""
    importance: str
    steps: List[str]
    verification: str
    ai_tip: Optional[str] = None


class PageAnalysisRequest(BaseModel):
    """Request for AI page analysis."""
    page_indices: List[int]


class PageAnalysisResponse(BaseModel):
    """Response for AI page analysis."""
    page_score: int
    summary: str
    issues: List[str]
    recommendations: List[str]
    impact: str


class AltTextRequest(BaseModel):
    """Request for AI alt text generation."""
    image_url: str


class AltTextResponse(BaseModel):
    """Response for AI alt text generation."""
    alt_text: str


class AuditListResponse(BaseModel):
    """Schema for paginated audit list."""
    total: int
    page: int
    page_size: int
    items: List[AuditResponse]


class AuditStatusResponse(BaseModel):
    """Schema for audit status check."""
    id: UUID
    status: AuditStatus
    processing_step: Optional[str] = None
    overall_score: Optional[float] = None
    error_message: Optional[str] = None
    completed_at: Optional[datetime] = None
    processing_logs: Optional[List[Dict[str, Any]]] = None
    ai_status: Optional[str] = None
    progress_percent: Optional[int] = None


# ============================================
# Health Check Schema
# ============================================

class HealthCheck(BaseModel):
    """Schema for health check response."""
    status: str
    version: str
    database: str
    timestamp: datetime


# ============================================
# Error Schemas
# ============================================

class ErrorResponse(BaseModel):
    """Schema for error responses."""
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None


class ValidationError(BaseModel):
    """Schema for validation errors."""
    field: str
    message: str


class ValidationErrorResponse(BaseModel):
    """Schema for validation error response."""
    error: str = "Validation Error"
    details: List[ValidationError]
