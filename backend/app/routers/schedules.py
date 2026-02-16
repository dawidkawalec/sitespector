"""
Audit scheduling endpoints.
"""

import logging
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.database import get_db
from app.models import AuditSchedule, ScheduleFrequency
from app.schemas import (
    AuditScheduleCreate,
    AuditScheduleUpdate,
    AuditScheduleResponse
)
from app.auth_supabase import get_current_user, verify_workspace_access, verify_project_access

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/schedules", tags=["Schedules"])

def calculate_next_run(frequency: ScheduleFrequency) -> datetime:
    now = datetime.utcnow()
    if frequency == ScheduleFrequency.DAILY:
        return now + timedelta(days=1)
    elif frequency == ScheduleFrequency.WEEKLY:
        return now + timedelta(weeks=1)
    elif frequency == ScheduleFrequency.MONTHLY:
        # Simple monthly addition
        return now + timedelta(days=30)
    return now

@router.post("", response_model=AuditScheduleResponse, status_code=status.HTTP_201_CREATED)
async def create_schedule(
    schedule_data: AuditScheduleCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AuditSchedule:
    """Create a new recurring audit schedule. Optionally link to a project."""
    # Verify workspace membership
    has_access = await verify_workspace_access(current_user["id"], str(schedule_data.workspace_id))
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this workspace"
        )
    # If project_id provided, verify project access
    schedule_project_id = None
    if schedule_data.project_id:
        from app.lib.supabase import get_project
        project = await get_project(str(schedule_data.project_id))
        if not project or str(project.get("workspace_id")) != str(schedule_data.workspace_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Project not found or does not belong to this workspace"
            )
        if not await verify_project_access(
            current_user["id"], str(schedule_data.project_id), str(schedule_data.workspace_id)
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to add schedules to this project"
            )
        schedule_project_id = schedule_data.project_id
    
    new_schedule = AuditSchedule(
        user_id=current_user["id"],
        workspace_id=schedule_data.workspace_id,
        project_id=schedule_project_id,
        url=schedule_data.url,
        frequency=schedule_data.frequency,
        include_competitors=schedule_data.include_competitors,
        competitors_urls=schedule_data.competitors_urls,
        next_run_at=calculate_next_run(schedule_data.frequency)
    )
    
    db.add(new_schedule)
    await db.commit()
    await db.refresh(new_schedule)
    
    logger.info(f"✅ Created schedule {new_schedule.id} for {new_schedule.url}")
    return new_schedule

@router.get("", response_model=List[AuditScheduleResponse])
async def list_schedules(
    workspace_id: UUID = Query(..., description="Workspace ID"),
    project_id: Optional[UUID] = Query(None, description="Optional project ID to filter by"),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[AuditSchedule]:
    """List all schedules for a workspace, optionally filtered by project."""
    has_access = await verify_workspace_access(current_user["id"], str(workspace_id))
    if not has_access:
        raise HTTPException(status_code=403, detail="Forbidden")
    if project_id:
        if not await verify_project_access(
            current_user["id"], str(project_id), str(workspace_id)
        ):
            raise HTTPException(status_code=403, detail="Not authorized to access this project")
    
    query = select(AuditSchedule).where(AuditSchedule.workspace_id == workspace_id)
    if project_id:
        query = query.where(AuditSchedule.project_id == project_id)
    result = await db.execute(query)
    return result.scalars().all()

@router.patch("/{schedule_id}", response_model=AuditScheduleResponse)
async def update_schedule(
    schedule_id: UUID,
    update_data: AuditScheduleUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AuditSchedule:
    """Update a schedule."""
    result = await db.execute(
        select(AuditSchedule).where(AuditSchedule.id == schedule_id)
    )
    schedule = result.scalar_one_or_none()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    has_access = await verify_workspace_access(current_user["id"], str(schedule.workspace_id))
    if not has_access:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    # Update fields
    if update_data.frequency is not None:
        schedule.frequency = update_data.frequency
        schedule.next_run_at = calculate_next_run(schedule.frequency)
    if update_data.is_active is not None:
        schedule.is_active = update_data.is_active
    if update_data.include_competitors is not None:
        schedule.include_competitors = update_data.include_competitors
    if update_data.competitors_urls is not None:
        schedule.competitors_urls = update_data.competitors_urls
        
    await db.commit()
    await db.refresh(schedule)
    return schedule

@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schedule(
    schedule_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a schedule."""
    result = await db.execute(
        select(AuditSchedule).where(AuditSchedule.id == schedule_id)
    )
    schedule = result.scalar_one_or_none()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    has_access = await verify_workspace_access(current_user["id"], str(schedule.workspace_id), required_role="admin")
    if not has_access:
        raise HTTPException(status_code=403, detail="Forbidden (admin required)")
        
    await db.delete(schedule)
    await db.commit()
