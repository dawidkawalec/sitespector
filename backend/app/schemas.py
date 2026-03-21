"""
Pydantic schemas for request/response validation.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, validator
from app.models import SubscriptionTier, AuditStatus, CompetitorStatus, ScheduleFrequency, TaskStatus, TaskPriority


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
    project_id: Optional[UUID] = None


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
    project_id: Optional[UUID] = None
    is_active: bool
    last_run_at: Optional[datetime] = None
    next_run_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================
# Project Schemas
# ============================================

class ProjectCreate(BaseModel):
    """Schema for creating project."""
    name: str = Field(..., min_length=1, max_length=255)
    url: str = Field(..., max_length=2048)
    description: Optional[str] = Field(None, max_length=2000)

    @validator("url")
    def validate_url(cls, v: str) -> str:
        if not v.startswith(("http://", "https://")):
            v = f"https://{v}"
        return v


class ProjectUpdate(BaseModel):
    """Schema for updating project."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    url: Optional[str] = Field(None, max_length=2048)
    description: Optional[str] = Field(None, max_length=2000)

    @validator("url")
    def validate_url(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if not v.startswith(("http://", "https://")):
            v = f"https://{v}"
        return v


class ProjectStats(BaseModel):
    """Optional stats for project response."""
    audits_count: int = 0
    latest_audit_score: Optional[float] = None
    latest_audit_at: Optional[datetime] = None
    schedule_active: bool = False


class ProjectResponse(BaseModel):
    """Schema for project response."""
    id: UUID
    workspace_id: UUID
    name: str
    url: str
    description: Optional[str] = None
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    stats: Optional[ProjectStats] = None

    class Config:
        from_attributes = True


class ProjectMemberCreate(BaseModel):
    """Schema for adding project member."""
    user_id: UUID
    role: str = Field(..., pattern="^(manager|member|viewer)$")


class ProjectMemberUpdate(BaseModel):
    """Schema for updating project member role."""
    role: str = Field(..., pattern="^(manager|member|viewer)$")


class ProjectMemberResponse(BaseModel):
    """Schema for project member response."""
    id: UUID
    project_id: UUID
    user_id: UUID
    role: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    created_at: datetime

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
    project_id: Optional[UUID] = None
    competitors: List[str] = Field(
        default=[],
        max_items=3,
        description="Up to 3 competitor URLs"
    )
    senuto_country_id: Optional[int] = Field(default=200, description="Senuto country ID")
    senuto_fetch_mode: Optional[str] = Field(default="subdomain", description="Senuto fetch mode")
    run_ai_pipeline: Optional[bool] = Field(default=True, description="Run AI analysis automatically")
    run_execution_plan: Optional[bool] = Field(default=True, description="Generate execution plan automatically")
    crawler_user_agent: Optional[str] = Field(default=None, max_length=500, description="Custom User-Agent for crawler (whitelist in Cloudflare)")

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
    project_id: Optional[UUID] = None
    status: AuditStatus
    ai_status: Optional[str] = None
    execution_plan_status: Optional[str] = None
    processing_step: Optional[str] = None
    processing_logs: Optional[List[Dict[str, Any]]] = None
    progress_percent: Optional[int] = None
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
    senuto_country_id: Optional[int] = None
    senuto_fetch_mode: Optional[str] = None
    crawler_user_agent: Optional[str] = None
    crawl_blocked: bool = False

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
    execution_plan_status: Optional[str] = None
    progress_percent: Optional[int] = None


# ============================================
# Task Schemas
# ============================================

class AuditTaskBase(BaseModel):
    """Base audit task schema."""
    module: str = Field(..., max_length=50)
    title: str = Field(..., max_length=500)
    description: str
    category: str = Field(..., max_length=50)
    priority: TaskPriority
    impact: str = Field(..., max_length=20)
    effort: str = Field(..., max_length=20)
    is_quick_win: bool = False
    fix_data: Optional[Dict[str, Any]] = None
    source: str = Field(..., max_length=50)
    sort_order: int = 0


class AuditTaskCreate(AuditTaskBase):
    """Schema for creating audit task."""
    audit_id: UUID


class AuditTaskUpdate(BaseModel):
    """Schema for updating audit task."""
    status: Optional[TaskStatus] = None
    notes: Optional[str] = None
    priority: Optional[TaskPriority] = None


class AuditTaskBulkUpdate(BaseModel):
    """Schema for bulk updating audit tasks."""
    task_ids: List[UUID] = Field(..., min_items=1)
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None


class AuditTaskResponse(AuditTaskBase):
    """Schema for audit task response."""
    id: UUID
    audit_id: UUID
    status: TaskStatus
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TaskSummaryResponse(BaseModel):
    """Schema for task summary statistics."""
    total: int
    pending: int
    done: int
    quick_wins_total: int
    quick_wins_done: int
    by_module: Dict[str, Dict[str, int]]
    by_priority: Dict[str, int]


class AuditTaskListResponse(BaseModel):
    """Schema for paginated task list."""
    total: int
    items: List[AuditTaskResponse]


# ============================================
# Public Form Schemas
# ============================================

class ContactForm(BaseModel):
    """Schema for public contact form."""
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    subject: str = Field(..., min_length=2, max_length=255)
    message: str = Field(..., min_length=20)


class NewsletterForm(BaseModel):
    """Schema for newsletter subscription."""
    email: EmailStr


# ============================================
# Business Context Schemas
# ============================================

class BusinessContextCreate(BaseModel):
    """Schema for creating/updating business context."""
    workspace_id: UUID
    project_id: Optional[UUID] = None
    business_type: Optional[str] = None
    industry: Optional[str] = None
    target_audience: Optional[str] = None
    geographic_focus: Optional[str] = None
    business_goals: Optional[List[str]] = None
    priorities: Optional[List[str]] = None
    key_products_services: Optional[List[str]] = None
    competitors_context: Optional[str] = None
    current_challenges: Optional[str] = None
    budget_range: Optional[str] = None
    team_capabilities: Optional[str] = None
    smart_form_questions: Optional[List[Dict[str, Any]]] = None
    source: Optional[str] = None


class BusinessContextResponse(BaseModel):
    """Schema for business context response."""
    id: UUID
    workspace_id: UUID
    project_id: Optional[UUID] = None
    business_type: Optional[str] = None
    industry: Optional[str] = None
    target_audience: Optional[str] = None
    geographic_focus: Optional[str] = None
    business_goals: Optional[List[str]] = None
    priorities: Optional[List[str]] = None
    key_products_services: Optional[List[str]] = None
    competitors_context: Optional[str] = None
    current_challenges: Optional[str] = None
    budget_range: Optional[str] = None
    team_capabilities: Optional[str] = None
    smart_form_questions: Optional[List[Dict[str, Any]]] = None
    source: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SmartFormResponse(BaseModel):
    """Schema for AI-generated smart form questions."""
    questions: List[Dict[str, Any]]


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
    """error": "Validation Error"
    details: List[ValidationError]
"""
    error: str = "Validation Error"
    details: List[ValidationError]
