"""
Task endpoints: CRUD operations for audit execution plan tasks.

Version: 1.0
- Interactive task management
- Status tracking (pending/done)
- Notes and priority updates
- Quick wins filtering
"""

import logging
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, update
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import Audit, AuditTask, TaskStatus, TaskPriority
from app.schemas import (
    AuditTaskResponse,
    AuditTaskUpdate,
    AuditTaskBulkUpdate,
    TaskSummaryResponse,
    AuditTaskListResponse,
)
from app.auth_supabase import get_current_user
from app.services.audit_access import get_audit_with_access

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/audits/{audit_id}/tasks", tags=["Tasks"])


async def _verify_audit_access(audit_id: UUID, user_id: str, db: AsyncSession) -> Audit:
    """Verify user has access to audit with unified workspace+project ACL checks."""
    return await get_audit_with_access(db, audit_id, user_id)


@router.get("", response_model=AuditTaskListResponse)
async def list_tasks(
    audit_id: UUID,
    module: Optional[str] = Query(None, description="Filter by module"),
    priority: Optional[TaskPriority] = Query(None, description="Filter by priority"),
    status_filter: Optional[TaskStatus] = Query(None, alias="status", description="Filter by status"),
    is_quick_win: Optional[bool] = Query(None, description="Filter quick wins only"),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    List all tasks for an audit with optional filters.
    
    - **audit_id**: Audit ID (path parameter)
    - **module**: Filter by module (seo, performance, visibility, etc.)
    - **priority**: Filter by priority (critical, high, medium, low)
    - **status**: Filter by status (pending, done)
    - **is_quick_win**: Filter quick wins only
    
    Returns:
        List of tasks matching filters
    
    Raises:
        403: If user is not a member of the workspace
        404: If audit not found
    """
    # Verify access
    await _verify_audit_access(audit_id, current_user["id"], db)
    
    # Build query
    query = select(AuditTask).where(AuditTask.audit_id == audit_id)
    
    if module:
        query = query.where(AuditTask.module == module)
    
    if priority:
        query = query.where(AuditTask.priority == priority)
    
    if status_filter:
        query = query.where(AuditTask.status == status_filter)
    
    if is_quick_win is not None:
        query = query.where(AuditTask.is_quick_win == is_quick_win)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Order by sort_order, then created_at
    query = query.order_by(AuditTask.sort_order, AuditTask.created_at)
    
    result = await db.execute(query)
    tasks = result.scalars().all()
    
    return {
        "total": total,
        "items": tasks,
    }


@router.get("/summary", response_model=TaskSummaryResponse)
async def get_task_summary(
    audit_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Get task summary statistics for an audit.
    
    Returns counts by status, module, priority, and quick wins.
    
    Raises:
        403: If user is not a member of the workspace
        404: If audit not found
    """
    # Verify access
    await _verify_audit_access(audit_id, current_user["id"], db)
    
    # Get all tasks for this audit
    result = await db.execute(
        select(AuditTask).where(AuditTask.audit_id == audit_id)
    )
    tasks = result.scalars().all()
    
    total = len(tasks)
    pending = sum(1 for t in tasks if t.status == TaskStatus.PENDING)
    done = sum(1 for t in tasks if t.status == TaskStatus.DONE)
    quick_wins_total = sum(1 for t in tasks if t.is_quick_win)
    quick_wins_done = sum(1 for t in tasks if t.is_quick_win and t.status == TaskStatus.DONE)
    
    # By module
    by_module = {}
    for task in tasks:
        if task.module not in by_module:
            by_module[task.module] = {"total": 0, "pending": 0, "done": 0}
        by_module[task.module]["total"] += 1
        if task.status == TaskStatus.PENDING:
            by_module[task.module]["pending"] += 1
        else:
            by_module[task.module]["done"] += 1
    
    # By priority
    by_priority = {}
    for priority in TaskPriority:
        by_priority[priority.value] = sum(1 for t in tasks if t.priority == priority)
    
    return {
        "total": total,
        "pending": pending,
        "done": done,
        "quick_wins_total": quick_wins_total,
        "quick_wins_done": quick_wins_done,
        "by_module": by_module,
        "by_priority": by_priority,
    }


@router.patch("/{task_id}", response_model=AuditTaskResponse)
async def update_task(
    audit_id: UUID,
    task_id: UUID,
    task_update: AuditTaskUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AuditTask:
    """
    Update a task (status, notes, priority).
    
    - **audit_id**: Audit ID (path parameter)
    - **task_id**: Task ID (path parameter)
    - **status**: New status (pending, done)
    - **notes**: User notes
    - **priority**: New priority (critical, high, medium, low)
    
    Returns:
        Updated task object
    
    Raises:
        403: If user is not a member of the workspace
        404: If audit or task not found
    """
    # Verify access
    await _verify_audit_access(audit_id, current_user["id"], db)
    
    # Get task
    result = await db.execute(
        select(AuditTask).where(
            and_(AuditTask.id == task_id, AuditTask.audit_id == audit_id)
        )
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Update fields
    if task_update.status is not None:
        task.status = task_update.status
        if task_update.status == TaskStatus.DONE and not task.completed_at:
            task.completed_at = datetime.utcnow()
        elif task_update.status == TaskStatus.PENDING:
            task.completed_at = None
    
    if task_update.notes is not None:
        task.notes = task_update.notes
    
    if task_update.priority is not None:
        task.priority = task_update.priority
    
    await db.commit()
    await db.refresh(task)
    
    logger.info(f"✅ Updated task {task_id} for audit {audit_id}")
    
    return task


@router.patch("/bulk", response_model=dict)
async def bulk_update_tasks(
    audit_id: UUID,
    bulk_update: AuditTaskBulkUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Bulk update multiple tasks at once.
    
    - **audit_id**: Audit ID (path parameter)
    - **task_ids**: List of task IDs to update
    - **status**: New status for all tasks
    - **priority**: New priority for all tasks
    
    Returns:
        Number of tasks updated
    
    Raises:
        403: If user is not a member of the workspace
        404: If audit not found
    """
    # Verify access
    await _verify_audit_access(audit_id, current_user["id"], db)
    
    # Build update dict
    update_values = {}
    
    if bulk_update.status is not None:
        update_values["status"] = bulk_update.status
        if bulk_update.status == TaskStatus.DONE:
            update_values["completed_at"] = datetime.utcnow()
        elif bulk_update.status == TaskStatus.PENDING:
            update_values["completed_at"] = None
    
    if bulk_update.priority is not None:
        update_values["priority"] = bulk_update.priority
    
    if not update_values:
        return {"updated": 0}
    
    # Execute bulk update
    stmt = (
        update(AuditTask)
        .where(
            and_(
                AuditTask.id.in_(bulk_update.task_ids),
                AuditTask.audit_id == audit_id
            )
        )
        .values(**update_values)
    )
    
    result = await db.execute(stmt)
    await db.commit()
    
    updated_count = result.rowcount
    
    logger.info(f"✅ Bulk updated {updated_count} tasks for audit {audit_id}")
    
    return {"updated": updated_count}
