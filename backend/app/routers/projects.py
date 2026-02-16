"""
Project endpoints: CRUD and member management for projects within workspaces.

Projects live in Supabase; audit/schedule data lives in VPS PostgreSQL with project_id.
"""

import logging
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, update

from app.database import get_db
from app.models import Audit, AuditSchedule, AuditStatus
from app.schemas import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectStats,
    ProjectMemberCreate,
    ProjectMemberUpdate,
    ProjectMemberResponse,
)
from app.auth_supabase import get_current_user, verify_workspace_access, verify_project_access
from app.lib.supabase import (
    supabase,
    get_project,
    get_project_members,
    verify_workspace_membership,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/projects", tags=["Projects"])


async def _get_project_stats(db: AsyncSession, project_id: str) -> ProjectStats:
    """Compute project stats from VPS audits and schedules."""
    project_uuid = UUID(project_id) if isinstance(project_id, str) else project_id

    # Count audits
    count_result = await db.execute(
        select(func.count()).select_from(Audit).where(Audit.project_id == project_uuid)
    )
    audits_count = count_result.scalar() or 0

    # Latest completed audit score and date
    latest_result = await db.execute(
        select(Audit.overall_score, Audit.completed_at)
        .where(Audit.project_id == project_uuid, Audit.status == AuditStatus.COMPLETED)
        .order_by(desc(Audit.completed_at))
        .limit(1)
    )
    row = latest_result.first()
    latest_audit_score = float(row[0]) if row and row[0] is not None else None
    latest_audit_at = row[1] if row and row[1] else None

    # Any active schedule for this project
    sched_result = await db.execute(
        select(func.count()).select_from(AuditSchedule).where(
            AuditSchedule.project_id == project_uuid,
            AuditSchedule.is_active.is_(True),
        )
    )
    schedule_active = (sched_result.scalar() or 0) > 0

    return ProjectStats(
        audits_count=audits_count,
        latest_audit_score=latest_audit_score,
        latest_audit_at=latest_audit_at,
        schedule_active=schedule_active,
    )


def _project_row_to_response(row: dict, stats: Optional[ProjectStats] = None) -> dict:
    """Map Supabase project row to ProjectResponse shape."""
    out = {
        "id": row["id"],
        "workspace_id": row["workspace_id"],
        "name": row["name"],
        "url": row["url"],
        "description": row.get("description"),
        "created_by": row.get("created_by"),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }
    if stats is not None:
        out["stats"] = stats
    return out


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    workspace_id: str = Query(..., description="Workspace ID"),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a project. Requires workspace admin or owner."""
    has_access = await verify_workspace_access(
        current_user["id"], workspace_id, required_role="admin"
    )
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create projects in this workspace",
        )

    response = supabase.table("projects").insert(
        {
            "workspace_id": workspace_id,
            "name": data.name,
            "url": data.url,
            "description": data.description,
            "created_by": current_user["id"],
        }
    ).execute()

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create project",
        )
    project = response.data[0]
    stats = await _get_project_stats(db, project["id"])
    return _project_row_to_response(project, stats)


@router.get("", response_model=List[dict])
async def list_projects(
    workspace_id: str = Query(..., description="Workspace ID"),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List projects in workspace. Admin/owner see all; members see only assigned projects."""
    ws_membership = await verify_workspace_membership(current_user["id"], workspace_id)
    if not ws_membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this workspace",
        )

    if ws_membership["role"] in ("owner", "admin"):
        response = (
            supabase.table("projects")
            .select("*")
            .eq("workspace_id", workspace_id)
            .order("created_at", desc=True)
            .execute()
        )
        project_rows = response.data or []
    else:
        # Workspace member: only projects they are in
        pm_response = (
            supabase.table("project_members")
            .select("project_id")
            .eq("user_id", current_user["id"])
            .execute()
        )
        project_ids = [r["project_id"] for r in (pm_response.data or [])]
        if not project_ids:
            return []
        response = (
            supabase.table("projects")
            .select("*")
            .in_("id", project_ids)
            .order("created_at", desc=True)
            .execute()
        )
        project_rows = response.data or []

    result = []
    for row in project_rows:
        stats = await _get_project_stats(db, row["id"])
        result.append(_project_row_to_response(row, stats))
    return result


@router.get("/{project_id}")
async def get_project_detail(
    project_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get project by ID with stats. Requires project access."""
    project = await get_project(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    has_access = await verify_project_access(
        current_user["id"],
        project_id,
        str(project["workspace_id"]),
    )
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this project",
        )
    stats = await _get_project_stats(db, project_id)
    return _project_row_to_response(project, stats)


@router.patch("/{project_id}")
async def update_project(
    project_id: str,
    data: ProjectUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update project. Requires workspace admin/owner or project manager."""
    project = await get_project(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    has_access = await verify_project_access(
        current_user["id"],
        project_id,
        str(project["workspace_id"]),
        required_role="manager",
    )
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this project",
        )

    payload = data.model_dump(exclude_unset=True)
    if not payload:
        return _project_row_to_response(project)

    response = (
        supabase.table("projects")
        .update(payload)
        .eq("id", project_id)
        .execute()
    )
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update project",
        )
    return _project_row_to_response(response.data[0])


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete project. Workspace admin/owner only. Unlinks audits/schedules in VPS."""
    project = await get_project(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    has_access = await verify_workspace_access(
        current_user["id"],
        str(project["workspace_id"]),
        required_role="admin",
    )
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only workspace admins can delete projects",
        )

    project_uuid = UUID(project_id)
    # Unlink audits and schedules (do not delete them)
    await db.execute(update(Audit).where(Audit.project_id == project_uuid).values(project_id=None))
    await db.execute(
        update(AuditSchedule).where(AuditSchedule.project_id == project_uuid).values(project_id=None)
    )
    await db.commit()

    supabase.table("projects").delete().eq("id", project_id).execute()
    return None


# --- Project members ---


@router.get("/{project_id}/members", response_model=List[dict])
async def list_project_members(
    project_id: str,
    current_user: dict = Depends(get_current_user),
):
    """List project members. Requires project access."""
    project = await get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    has_access = await verify_project_access(
        current_user["id"], project_id, str(project["workspace_id"])
    )
    if not has_access:
        raise HTTPException(status_code=403, detail="Not authorized")

    members = await get_project_members(project_id)
    result = []
    for m in members:
        # Enrich with email/full_name from auth if available (backend may use service role)
        try:
            user_resp = supabase.auth.admin.get_user_by_id(m["user_id"])
            email = user_resp.user.email if user_resp and user_resp.user else None
        except Exception:
            email = None
        prof = (
            supabase.table("profiles")
            .select("full_name")
            .eq("id", m["user_id"])
            .execute()
        )
        full_name = None
        if prof.data and len(prof.data) > 0:
            full_name = prof.data[0].get("full_name")
        result.append({
            "id": m["id"],
            "project_id": m["project_id"],
            "user_id": m["user_id"],
            "role": m["role"],
            "email": email,
            "full_name": full_name,
            "created_at": m["created_at"],
        })
    return result


@router.post("/{project_id}/members", status_code=status.HTTP_201_CREATED)
async def add_project_member(
    project_id: str,
    data: ProjectMemberCreate,
    current_user: dict = Depends(get_current_user),
):
    """Add a project member. User must be workspace member. Requires project manager or workspace admin."""
    project = await get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    has_access = await verify_project_access(
        current_user["id"], project_id, str(project["workspace_id"]), required_role="manager"
    )
    if not has_access:
        raise HTTPException(status_code=403, detail="Not authorized to add members")

    # Ensure user is in workspace
    ws_ok = await verify_workspace_membership(str(data.user_id), str(project["workspace_id"]))
    if not ws_ok:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must be a member of the workspace first",
        )

    try:
        response = (
            supabase.table("project_members")
            .insert({
                "project_id": project_id,
                "user_id": str(data.user_id),
                "role": data.role,
            })
            .execute()
        )
    except Exception as e:
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User is already a project member",
            )
        raise HTTPException(status_code=500, detail=str(e))

    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to add member")
    return response.data[0]


@router.patch("/{project_id}/members/{member_id}")
async def update_project_member(
    project_id: str,
    member_id: str,
    data: ProjectMemberUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update project member role. Requires project manager or workspace admin."""
    project = await get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    has_access = await verify_project_access(
        current_user["id"], project_id, str(project["workspace_id"]), required_role="manager"
    )
    if not has_access:
        raise HTTPException(status_code=403, detail="Not authorized")

    response = (
        supabase.table("project_members")
        .update({"role": data.role})
        .eq("id", member_id)
        .eq("project_id", project_id)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Project member not found")
    return response.data[0]


@router.delete("/{project_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_project_member(
    project_id: str,
    member_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Remove project member. Requires project manager or workspace admin."""
    project = await get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    has_access = await verify_project_access(
        current_user["id"], project_id, str(project["workspace_id"]), required_role="manager"
    )
    if not has_access:
        raise HTTPException(status_code=403, detail="Not authorized")

    supabase.table("project_members").delete().eq("id", member_id).eq(
        "project_id", project_id
    ).execute()
    return None
