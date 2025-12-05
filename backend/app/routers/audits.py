"""
Audit endpoints: CRUD operations for website audits.
"""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import User, Audit, Competitor, AuditStatus
from app.schemas import (
    AuditCreate,
    AuditResponse,
    AuditListResponse,
    AuditStatusResponse,
    AuditUpdate,
)
from app.auth import get_current_active_user

router = APIRouter(prefix="/audits", tags=["Audits"])


@router.post("", response_model=AuditResponse, status_code=status.HTTP_201_CREATED)
async def create_audit(
    audit_data: AuditCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Audit:
    """
    Create a new website audit.
    
    - **url**: Website URL to audit (required)
    - **competitors**: List of up to 3 competitor URLs (optional)
    
    The audit will be processed asynchronously by the worker.
    
    Returns:
        Created audit object with status='pending'
    """
    # Create audit
    new_audit = Audit(
        user_id=current_user.id,
        url=audit_data.url,
        status=AuditStatus.PENDING,
    )
    
    db.add(new_audit)
    await db.flush()  # Get audit ID
    
    # Create competitor records
    for competitor_url in audit_data.competitors:
        competitor = Competitor(
            audit_id=new_audit.id,
            url=competitor_url,
        )
        db.add(competitor)
    
    # Increment user's audit count
    current_user.audits_count += 1
    
    await db.commit()
    await db.refresh(new_audit)
    
    # Load competitors relationship
    result = await db.execute(
        select(Audit)
        .options(selectinload(Audit.competitors))
        .where(Audit.id == new_audit.id)
    )
    audit_with_competitors = result.scalar_one()
    
    return audit_with_competitors


@router.get("", response_model=AuditListResponse)
async def list_audits(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[AuditStatus] = Query(None, description="Filter by status"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    List all audits for the current user with pagination.
    
    - **page**: Page number (default: 1)
    - **page_size**: Items per page (default: 20, max: 100)
    - **status**: Filter by audit status (optional)
    
    Returns:
        Paginated list of audits
    """
    # Build query
    query = select(Audit).where(Audit.user_id == current_user.id)
    
    if status:
        query = query.where(Audit.status == status)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Paginate
    offset = (page - 1) * page_size
    query = (
        query
        .options(selectinload(Audit.competitors))
        .order_by(desc(Audit.created_at))
        .limit(page_size)
        .offset(offset)
    )
    
    result = await db.execute(query)
    audits = result.scalars().all()
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": audits,
    }


@router.get("/{audit_id}", response_model=AuditResponse)
async def get_audit(
    audit_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Audit:
    """
    Get a specific audit by ID.
    
    Returns:
        Audit object with full details and results
        
    Raises:
        404: If audit not found
        403: If audit belongs to another user
    """
    result = await db.execute(
        select(Audit)
        .options(selectinload(Audit.competitors))
        .where(Audit.id == audit_id)
    )
    audit = result.scalar_one_or_none()
    
    if not audit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit not found"
        )
    
    # Check ownership
    if audit.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this audit"
        )
    
    return audit


@router.get("/{audit_id}/status", response_model=AuditStatusResponse)
async def get_audit_status(
    audit_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Get audit status (for polling).
    
    Returns lightweight status information without full results.
    Useful for frontend polling while audit is processing.
    
    Returns:
        Audit status and basic info
        
    Raises:
        404: If audit not found
        403: If audit belongs to another user
    """
    result = await db.execute(
        select(Audit).where(Audit.id == audit_id)
    )
    audit = result.scalar_one_or_none()
    
    if not audit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit not found"
        )
    
    # Check ownership
    if audit.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this audit"
        )
    
    return {
        "id": audit.id,
        "status": audit.status,
        "overall_score": audit.overall_score,
        "error_message": audit.error_message,
        "completed_at": audit.completed_at,
    }


@router.delete("/{audit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_audit(
    audit_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """
    Delete an audit.
    
    Cascades to delete associated competitors.
    
    Raises:
        404: If audit not found
        403: If audit belongs to another user
    """
    result = await db.execute(
        select(Audit).where(Audit.id == audit_id)
    )
    audit = result.scalar_one_or_none()
    
    if not audit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit not found"
        )
    
    # Check ownership
    if audit.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this audit"
        )
    
    await db.delete(audit)
    await db.commit()

