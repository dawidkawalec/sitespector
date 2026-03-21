"""
Scoped report endpoints: list, create (generate), get, delete.
"""

import asyncio
import logging
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db, AsyncSessionLocal
from app.models import Audit, ScopedReport
from app.schemas import ScopedReportCreate, ScopedReportResponse
from app.auth_supabase import get_current_user, verify_workspace_access
from app.services.scoped_analysis import run_scoped_analysis, SCOPED_REPORT_CREDIT_COST
from app.services.credit_service import check_credits, deduct_credits

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/scoped-reports", tags=["ScopedReports"])

# Page type labels (server-side)
PAGE_TYPE_LABELS = {
    "homepage": "Strona glowna",
    "product": "Strony produktowe",
    "category": "Strony kategorii",
    "blog": "Artykuly blogowe",
    "service": "Strony uslug",
    "contact": "Kontakt",
    "about": "O nas",
    "other": "Inne strony",
}


@router.get("/audit/{audit_id}", response_model=List[ScopedReportResponse])
async def list_scoped_reports(
    audit_id: UUID,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all scoped reports for an audit."""
    result = await db.execute(select(Audit).where(Audit.id == audit_id))
    audit = result.scalar_one_or_none()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    if audit.workspace_id:
        await verify_workspace_access(user["id"], str(audit.workspace_id))

    result = await db.execute(
        select(ScopedReport)
        .where(ScopedReport.audit_id == audit_id)
        .order_by(ScopedReport.created_at.desc())
    )
    return result.scalars().all()


@router.post("/audit/{audit_id}", response_model=ScopedReportResponse, status_code=status.HTTP_201_CREATED)
async def create_scoped_report(
    audit_id: UUID,
    data: ScopedReportCreate,
    background_tasks: BackgroundTasks,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create and start generating a scoped report. Deducts credits."""
    result = await db.execute(select(Audit).where(Audit.id == audit_id))
    audit = result.scalar_one_or_none()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    if audit.workspace_id:
        await verify_workspace_access(user["id"], str(audit.workspace_id))

    if not audit.results or not audit.results.get("crawl"):
        raise HTTPException(status_code=400, detail="Audit has no crawl data")

    # Check credits
    workspace_id = str(audit.workspace_id) if audit.workspace_id else None
    if workspace_id:
        has_credits = await check_credits(db, workspace_id, SCOPED_REPORT_CREDIT_COST)
        if not has_credits:
            raise HTTPException(
                status_code=402,
                detail=f"Niewystarczajace kredyty. Potrzeba {SCOPED_REPORT_CREDIT_COST} kr."
            )

    # Build scope filter
    scope_filter = data.scope_filter or {"page_type": data.scope_type}
    scope_label = data.scope_label or PAGE_TYPE_LABELS.get(data.scope_type, data.scope_type)

    # Check that scope has pages
    classifications = audit.results.get("crawl", {}).get("page_classifications", {})
    if scope_filter.get("page_type"):
        matching = sum(1 for v in classifications.values() if v == scope_filter["page_type"])
        if matching == 0:
            raise HTTPException(status_code=400, detail=f"Brak stron typu '{data.scope_type}' w tym audycie")

    # Deduct credits
    if workspace_id:
        await deduct_credits(
            db, workspace_id, user["id"],
            SCOPED_REPORT_CREDIT_COST, "deduct_scoped_report",
            {"audit_id": str(audit_id), "scope_type": data.scope_type},
        )

    # Create report
    report = ScopedReport(
        audit_id=audit_id,
        scope_type=data.scope_type,
        scope_label=scope_label,
        scope_filter=scope_filter,
        credits_used=SCOPED_REPORT_CREDIT_COST,
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)

    # Run analysis in background
    report_id = report.id

    async def _run_in_background():
        async with AsyncSessionLocal() as bg_db:
            result = await bg_db.execute(select(ScopedReport).where(ScopedReport.id == report_id))
            bg_report = result.scalar_one_or_none()
            if bg_report:
                await run_scoped_analysis(bg_db, bg_report)

    background_tasks.add_task(_run_in_background)

    return report


@router.get("/{report_id}", response_model=ScopedReportResponse)
async def get_scoped_report(
    report_id: UUID,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single scoped report."""
    result = await db.execute(select(ScopedReport).where(ScopedReport.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Scoped report not found")

    # Auth check via parent audit
    audit_result = await db.execute(select(Audit).where(Audit.id == report.audit_id))
    audit = audit_result.scalar_one_or_none()
    if audit and audit.workspace_id:
        await verify_workspace_access(user["id"], str(audit.workspace_id))

    return report


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scoped_report(
    report_id: UUID,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a scoped report."""
    result = await db.execute(select(ScopedReport).where(ScopedReport.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Scoped report not found")

    audit_result = await db.execute(select(Audit).where(Audit.id == report.audit_id))
    audit = audit_result.scalar_one_or_none()
    if audit and audit.workspace_id:
        await verify_workspace_access(user["id"], str(audit.workspace_id))

    await db.delete(report)
    await db.commit()
