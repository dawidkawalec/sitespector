"""
Business context endpoints: CRUD + smart form generation + audit continuation.
"""

import logging
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Audit, AuditStatus, BusinessContext
from app.schemas import BusinessContextCreate, BusinessContextResponse, SmartFormResponse
from app.auth_supabase import get_current_user, verify_workspace_access
from app.services.business_context_service import generate_smart_form

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/business-context", tags=["BusinessContext"])


@router.post("", response_model=BusinessContextResponse, status_code=status.HTTP_201_CREATED)
async def create_business_context(
    data: BusinessContextCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create or update business context for a workspace/project."""
    await verify_workspace_access(user["id"], str(data.workspace_id))

    # Check if context already exists for this project
    if data.project_id:
        existing = await db.execute(
            select(BusinessContext).where(
                BusinessContext.workspace_id == data.workspace_id,
                BusinessContext.project_id == data.project_id,
            )
        )
        bc = existing.scalar_one_or_none()
        if bc:
            # Update existing
            for field, value in data.model_dump(exclude_unset=True, exclude={"workspace_id", "project_id"}).items():
                setattr(bc, field, value)
            await db.commit()
            await db.refresh(bc)
            return bc

    bc = BusinessContext(**data.model_dump())
    db.add(bc)
    await db.commit()
    await db.refresh(bc)
    return bc


@router.get("/{context_id}", response_model=BusinessContextResponse)
async def get_business_context(
    context_id: UUID,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get business context by ID."""
    result = await db.execute(select(BusinessContext).where(BusinessContext.id == context_id))
    bc = result.scalar_one_or_none()
    if not bc:
        raise HTTPException(status_code=404, detail="Business context not found")
    await verify_workspace_access(user["id"], str(bc.workspace_id))
    return bc


@router.get("/project/{project_id}", response_model=BusinessContextResponse)
async def get_business_context_by_project(
    project_id: UUID,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get business context for a project (latest)."""
    result = await db.execute(
        select(BusinessContext)
        .where(BusinessContext.project_id == project_id)
        .order_by(BusinessContext.updated_at.desc())
        .limit(1)
    )
    bc = result.scalar_one_or_none()
    if not bc:
        raise HTTPException(status_code=404, detail="No business context for this project")
    await verify_workspace_access(user["id"], str(bc.workspace_id))
    return bc


@router.put("/{context_id}", response_model=BusinessContextResponse)
async def update_business_context(
    context_id: UUID,
    data: BusinessContextCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update existing business context."""
    result = await db.execute(select(BusinessContext).where(BusinessContext.id == context_id))
    bc = result.scalar_one_or_none()
    if not bc:
        raise HTTPException(status_code=404, detail="Business context not found")
    await verify_workspace_access(user["id"], str(bc.workspace_id))

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(bc, field, value)
    await db.commit()
    await db.refresh(bc)
    return bc


# ---- Audit-scoped endpoints ----

@router.post("/audits/{audit_id}/generate-smart-form", response_model=SmartFormResponse)
async def generate_audit_smart_form(
    audit_id: UUID,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate AI-powered smart form questions based on audit Phase 1 data."""
    result = await db.execute(select(Audit).where(Audit.id == audit_id))
    audit = result.scalar_one_or_none()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    if audit.workspace_id:
        await verify_workspace_access(user["id"], str(audit.workspace_id))

    if not audit.results:
        raise HTTPException(status_code=400, detail="Audit has no results yet (Phase 1 not complete)")

    crawl_data = audit.results.get("crawl", {})
    lighthouse_data = audit.results.get("lighthouse", {})
    senuto_data = audit.results.get("senuto", {})

    questions = await generate_smart_form(crawl_data, lighthouse_data, senuto_data)
    return SmartFormResponse(questions=questions)


@router.post("/audits/{audit_id}/save-context-and-continue")
async def save_context_and_continue(
    audit_id: UUID,
    data: BusinessContextCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Save business context and resume audit (Phase 2)."""
    result = await db.execute(select(Audit).where(Audit.id == audit_id))
    audit = result.scalar_one_or_none()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    if audit.workspace_id:
        await verify_workspace_access(user["id"], str(audit.workspace_id))

    # Create or update business context
    bc = BusinessContext(**data.model_dump())
    db.add(bc)
    await db.flush()

    # Link to audit and resume processing
    audit.business_context_id = bc.id
    if audit.status == AuditStatus.AWAITING_CONTEXT:
        audit.status = AuditStatus.PENDING  # Worker will pick it up for Phase 2
        audit.processing_step = "context:saved"
    await db.commit()

    return {"status": "ok", "business_context_id": str(bc.id), "audit_status": audit.status.value}


@router.post("/audits/{audit_id}/skip-context")
async def skip_context(
    audit_id: UUID,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Skip business context and resume audit (Phase 2) without context."""
    result = await db.execute(select(Audit).where(Audit.id == audit_id))
    audit = result.scalar_one_or_none()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    if audit.workspace_id:
        await verify_workspace_access(user["id"], str(audit.workspace_id))

    if audit.status == AuditStatus.AWAITING_CONTEXT:
        audit.status = AuditStatus.PENDING  # Worker will pick it up for Phase 2
        audit.processing_step = "context:skipped"
    await db.commit()

    return {"status": "ok", "audit_status": audit.status.value}
