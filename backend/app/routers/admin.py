"""
Super Admin Router for SiteSpector.

All endpoints require is_super_admin = true in the user's profile.
Protected by verify_super_admin dependency.
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Optional
from uuid import UUID
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from jose import jwt
from pydantic import BaseModel, Field
from sqlalchemy import func, cast, Date, text, case
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.auth_supabase import get_current_user
from app.config import settings
from app.database import get_db
from app.lib.supabase import supabase
from app.models import Audit, AuditStatus, ChatMessage, ChatConversation

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin"])


class ImpersonationSessionCreateRequest(BaseModel):
    audit_id: UUID
    ttl_minutes: Optional[int] = Field(default=None, ge=1, le=240)


# ─── Guard ────────────────────────────────────────────────────────────────────

async def verify_super_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Allow only users with is_super_admin = true in their profile."""
    try:
        resp = supabase.table("profiles").select("is_super_admin").eq(
            "id", current_user["id"]
        ).execute()
        if not resp.data or not resp.data[0].get("is_super_admin"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Super admin access required",
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"verify_super_admin error: {e}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin access required")
    return current_user


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _list_all_users() -> list[dict]:
    """Fetch all auth users via Supabase Admin API (paginated)."""
    users = []
    page = 1
    per_page = 1000
    while True:
        resp = supabase.auth.admin.list_users(page=page, per_page=per_page)
        batch = resp if isinstance(resp, list) else getattr(resp, "users", [])
        if not batch:
            break
        users.extend(batch)
        if len(batch) < per_page:
            break
        page += 1
    return users


def _user_to_dict(u) -> dict:
    return {
        "id": str(u.id),
        "email": u.email or "",
        "created_at": u.created_at.isoformat() if u.created_at else None,
        "last_sign_in_at": u.last_sign_in_at.isoformat() if u.last_sign_in_at else None,
        "confirmed_at": u.confirmed_at.isoformat() if u.confirmed_at else None,
        "full_name": (u.user_metadata or {}).get("full_name"),
    }


# ─── Stats endpoint ───────────────────────────────────────────────────────────

@router.get("/stats", dependencies=[Depends(verify_super_admin)])
async def get_admin_stats(db: AsyncSession = Depends(get_db)):
    """
    Global KPI stats for the super admin overview dashboard.
    """
    now = _now_utc()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    # ── Audit stats from VPS PostgreSQL ──
    total_audits_result = await db.execute(select(func.count(Audit.id)))
    total_audits: int = total_audits_result.scalar() or 0

    audits_today_result = await db.execute(
        select(func.count(Audit.id)).where(Audit.created_at >= today_start)
    )
    audits_today: int = audits_today_result.scalar() or 0

    audits_this_month_result = await db.execute(
        select(func.count(Audit.id)).where(Audit.created_at >= month_ago)
    )
    audits_this_month: int = audits_this_month_result.scalar() or 0

    # Audits by status
    status_rows = await db.execute(
        select(Audit.status, func.count(Audit.id)).group_by(Audit.status)
    )
    audits_by_status = {row[0].value if hasattr(row[0], "value") else row[0]: row[1] for row in status_rows}

    # PDF reports generated (audits where pdf_url is not null)
    pdf_reports_result = await db.execute(
        select(func.count(Audit.id)).where(Audit.pdf_url.isnot(None))
    )
    pdf_reports: int = pdf_reports_result.scalar() or 0

    # Avg scores across completed audits
    scores_result = await db.execute(
        select(
            func.avg(Audit.overall_score),
            func.avg(Audit.seo_score),
            func.avg(Audit.performance_score),
            func.avg(Audit.content_score),
        ).where(Audit.status == AuditStatus.COMPLETED)
    )
    scores_row = scores_result.one()

    # Audits per day (last 30d)
    audits_per_day_result = await db.execute(
        select(
            cast(Audit.created_at, Date).label("day"),
            func.count(Audit.id).label("count"),
        )
        .where(Audit.created_at >= month_ago)
        .group_by(cast(Audit.created_at, Date))
        .order_by(cast(Audit.created_at, Date))
    )
    audits_per_day = [{"date": str(row.day), "count": row.count} for row in audits_per_day_result]

    # Pending audits (worker queue)
    pending_count_result = await db.execute(
        select(func.count(Audit.id)).where(
            Audit.status.in_([AuditStatus.PENDING, AuditStatus.PROCESSING])
        )
    )
    pending_queue: int = pending_count_result.scalar() or 0

    # Average processing time (minutes) for completed audits
    avg_duration_result = await db.execute(
        text(
            "SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60) "
            "FROM audits WHERE status = 'COMPLETED' AND started_at IS NOT NULL AND completed_at IS NOT NULL"
        )
    )
    avg_duration_min = avg_duration_result.scalar()

    # ── Supabase stats ──
    try:
        all_users = _list_all_users()
        total_users = len(all_users)
        new_users_7d = sum(
            1 for u in all_users
            if u.created_at and (now - u.created_at.replace(tzinfo=timezone.utc)).days <= 7
        )
        new_users_30d = sum(
            1 for u in all_users
            if u.created_at and (now - u.created_at.replace(tzinfo=timezone.utc)).days <= 30
        )
    except Exception as e:
        logger.error(f"Failed to list users: {e}")
        total_users = 0
        new_users_7d = 0
        new_users_30d = 0

    # Workspaces
    try:
        ws_resp = supabase.table("workspaces").select("id", count="exact").execute()
        total_workspaces = ws_resp.count or 0
    except Exception:
        total_workspaces = 0

    # Projects
    try:
        proj_resp = supabase.table("projects").select("id", count="exact").execute()
        total_projects = proj_resp.count or 0
    except Exception:
        total_projects = 0

    # Plan distribution
    try:
        plans_resp = supabase.table("subscriptions").select("plan").execute()
        plan_distribution: dict[str, int] = {}
        for row in (plans_resp.data or []):
            plan = row.get("plan", "free")
            plan_distribution[plan] = plan_distribution.get(plan, 0) + 1
    except Exception:
        plan_distribution = {}

    # Revenue (sum of invoice amounts)
    try:
        invoices_resp = supabase.table("invoices").select("amount_paid").execute()
        total_revenue_cents = sum(r.get("amount_paid", 0) for r in (invoices_resp.data or []))
        total_revenue_usd = total_revenue_cents / 100
    except Exception:
        total_revenue_usd = 0.0

    return {
        "users": {
            "total": total_users,
            "new_7d": new_users_7d,
            "new_30d": new_users_30d,
        },
        "workspaces": {"total": total_workspaces},
        "projects": {"total": total_projects},
        "audits": {
            "total": total_audits,
            "today": audits_today,
            "this_month": audits_this_month,
            "pending_queue": pending_queue,
            "by_status": audits_by_status,
            "per_day_30d": audits_per_day,
            "avg_processing_minutes": round(float(avg_duration_min), 2) if avg_duration_min else None,
            "avg_overall_score": round(float(scores_row[0]), 1) if scores_row[0] else None,
            "avg_seo_score": round(float(scores_row[1]), 1) if scores_row[1] else None,
            "avg_performance_score": round(float(scores_row[2]), 1) if scores_row[2] else None,
            "avg_content_score": round(float(scores_row[3]), 1) if scores_row[3] else None,
        },
        "reports": {"pdf_generated": pdf_reports},
        "billing": {
            "plan_distribution": plan_distribution,
            "total_revenue_usd": total_revenue_usd,
        },
    }


# ─── Users list ───────────────────────────────────────────────────────────────

@router.get("/users", dependencies=[Depends(verify_super_admin)])
async def list_admin_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str = Query(""),
    db: AsyncSession = Depends(get_db),
):
    """
    List all users with aggregated stats (audit count, plan, workspace count).
    """
    try:
        all_users = _list_all_users()
    except Exception as e:
        logger.error(f"list_admin_users: failed to fetch users: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch users")

    # Filter by search
    if search:
        q = search.lower()
        all_users = [u for u in all_users if q in (u.email or "").lower() or q in ((u.user_metadata or {}).get("full_name") or "").lower()]

    total = len(all_users)

    # Paginate
    offset = (page - 1) * per_page
    page_users = all_users[offset: offset + per_page]
    user_ids = [str(u.id) for u in page_users]

    if not user_ids:
        return {"total": total, "page": page, "per_page": per_page, "items": []}

    # Fetch profiles for is_super_admin
    try:
        profiles_resp = supabase.table("profiles").select("id,full_name,is_super_admin").in_(
            "id", user_ids
        ).execute()
        profiles_by_id = {r["id"]: r for r in (profiles_resp.data or [])}
    except Exception:
        profiles_by_id = {}

    # Fetch workspace memberships
    try:
        ws_members_resp = supabase.table("workspace_members").select(
            "user_id,workspace_id,role"
        ).in_("user_id", user_ids).execute()
        ws_by_user: dict[str, list] = {}
        for r in (ws_members_resp.data or []):
            ws_by_user.setdefault(r["user_id"], []).append(r)
    except Exception:
        ws_by_user = {}

    # Fetch subscriptions for workspaces
    all_ws_ids = list({r["workspace_id"] for rows in ws_by_user.values() for r in rows})
    try:
        subs_resp = supabase.table("subscriptions").select(
            "workspace_id,plan,status,audit_limit,audits_used_this_month"
        ).in_("workspace_id", all_ws_ids).execute()
        subs_by_ws: dict[str, dict] = {r["workspace_id"]: r for r in (subs_resp.data or [])}
    except Exception:
        subs_by_ws = {}

    # Fetch audit counts per workspace_id from VPS PostgreSQL
    try:
        if all_ws_ids:
            audit_rows = await db.execute(
                select(Audit.workspace_id, func.count(Audit.id).label("cnt"))
                .where(Audit.workspace_id.in_([UUID(w) for w in all_ws_ids]))
                .group_by(Audit.workspace_id)
            )
            audits_by_ws: dict[str, int] = {str(row.workspace_id): row.cnt for row in audit_rows}
        else:
            audits_by_ws = {}
    except Exception:
        audits_by_ws = {}

    items = []
    for u in page_users:
        uid = str(u.id)
        profile = profiles_by_id.get(uid, {})
        memberships = ws_by_user.get(uid, [])

        # Determine plan from primary workspace subscription (owner role preferred)
        user_plan = "free"
        user_audit_limit = 5
        user_audits_used = 0
        user_ws_ids = [m["workspace_id"] for m in memberships]

        for ws_id in user_ws_ids:
            sub = subs_by_ws.get(ws_id)
            if sub:
                user_plan = sub.get("plan", "free")
                user_audit_limit = sub.get("audit_limit", 5)
                user_audits_used = sub.get("audits_used_this_month", 0)
                break

        total_audits = sum(audits_by_ws.get(ws_id, 0) for ws_id in user_ws_ids)

        items.append({
            "id": uid,
            "email": u.email or "",
            "full_name": profile.get("full_name") or (u.user_metadata or {}).get("full_name"),
            "is_super_admin": profile.get("is_super_admin", False),
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "last_sign_in_at": u.last_sign_in_at.isoformat() if u.last_sign_in_at else None,
            "workspace_count": len(memberships),
            "plan": user_plan,
            "audit_limit": user_audit_limit,
            "audits_used_this_month": user_audits_used,
            "total_audits": total_audits,
        })

    return {"total": total, "page": page, "per_page": per_page, "items": items}


# ─── User detail ──────────────────────────────────────────────────────────────

@router.get("/users/{user_id}", dependencies=[Depends(verify_super_admin)])
async def get_admin_user(user_id: str, db: AsyncSession = Depends(get_db)):
    """
    Full user profile with workspaces, subscriptions, and audit history.
    """
    try:
        user_resp = supabase.auth.admin.get_user_by_id(user_id)
        if not user_resp or not user_resp.user:
            raise HTTPException(status_code=404, detail="User not found")
        u = user_resp.user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"get_admin_user: {e}")
        raise HTTPException(status_code=404, detail="User not found")

    # Profile
    try:
        prof_resp = supabase.table("profiles").select("*").eq("id", user_id).execute()
        profile = prof_resp.data[0] if prof_resp.data else {}
    except Exception:
        profile = {}

    # Workspaces
    try:
        ws_members_resp = supabase.table("workspace_members").select(
            "workspace_id,role,workspaces(id,name,slug,type,created_at)"
        ).eq("user_id", user_id).execute()
        workspace_ids = []
        workspaces = []
        for row in (ws_members_resp.data or []):
            ws = row.get("workspaces") or {}
            workspace_ids.append(row["workspace_id"])
            workspaces.append({
                "id": row["workspace_id"],
                "name": ws.get("name", ""),
                "slug": ws.get("slug", ""),
                "type": ws.get("type", ""),
                "role": row["role"],
                "created_at": ws.get("created_at"),
            })
    except Exception:
        workspace_ids = []
        workspaces = []

    # Subscriptions per workspace
    try:
        if workspace_ids:
            subs_resp = supabase.table("subscriptions").select("*").in_(
                "workspace_id", workspace_ids
            ).execute()
            subs_by_ws: dict[str, dict] = {r["workspace_id"]: r for r in (subs_resp.data or [])}
        else:
            subs_by_ws = {}
        for ws in workspaces:
            ws["subscription"] = subs_by_ws.get(ws["id"])
    except Exception:
        pass

    # Projects count per workspace
    try:
        proj_resp = supabase.table("projects").select("workspace_id", count="exact").in_(
            "workspace_id", workspace_ids
        ).execute()
        projects_count = proj_resp.count or 0
    except Exception:
        projects_count = 0

    # Audits from VPS PostgreSQL
    try:
        if workspace_ids:
            audit_rows = await db.execute(
                select(Audit)
                .where(Audit.workspace_id.in_([UUID(w) for w in workspace_ids]))
                .order_by(Audit.created_at.desc())
                .limit(50)
            )
            user_audits = audit_rows.scalars().all()
            audits_list = [
                {
                    "id": str(a.id),
                    "url": a.url,
                    "status": a.status.value if a.status else None,
                    "overall_score": a.overall_score,
                    "seo_score": a.seo_score,
                    "performance_score": a.performance_score,
                    "content_score": a.content_score,
                    "workspace_id": str(a.workspace_id) if a.workspace_id else None,
                    "project_id": str(a.project_id) if a.project_id else None,
                    "created_at": a.created_at.isoformat() if a.created_at else None,
                    "completed_at": a.completed_at.isoformat() if a.completed_at else None,
                    "pdf_url": a.pdf_url,
                }
                for a in user_audits
            ]
            total_audit_count_result = await db.execute(
                select(func.count(Audit.id)).where(
                    Audit.workspace_id.in_([UUID(w) for w in workspace_ids])
                )
            )
            total_audit_count = total_audit_count_result.scalar() or 0
        else:
            audits_list = []
            total_audit_count = 0
    except Exception as e:
        logger.error(f"get_admin_user audits error: {e}")
        audits_list = []
        total_audit_count = 0

    # Chat usage
    try:
        if workspace_ids:
            chat_usage_result = await db.execute(
                select(func.count(ChatMessage.id)).where(
                    ChatMessage.conversation_id.in_(
                        select(ChatConversation.id).where(
                            ChatConversation.workspace_id.in_([UUID(w) for w in workspace_ids])
                        )
                    )
                )
            )
            chat_messages_count = chat_usage_result.scalar() or 0
        else:
            chat_messages_count = 0
    except Exception:
        chat_messages_count = 0

    return {
        "id": str(u.id),
        "email": u.email or "",
        "full_name": profile.get("full_name") or (u.user_metadata or {}).get("full_name"),
        "avatar_url": profile.get("avatar_url"),
        "is_super_admin": profile.get("is_super_admin", False),
        "created_at": u.created_at.isoformat() if u.created_at else None,
        "last_sign_in_at": u.last_sign_in_at.isoformat() if u.last_sign_in_at else None,
        "confirmed_at": u.confirmed_at.isoformat() if u.confirmed_at else None,
        "workspaces": workspaces,
        "projects_count": projects_count,
        "total_audits": total_audit_count,
        "audits": audits_list,
        "chat_messages_count": chat_messages_count,
    }


# ─── Reset workspace usage counter ───────────────────────────────────────────

@router.post("/workspaces/{workspace_id}/reset-usage", dependencies=[Depends(verify_super_admin)])
async def reset_workspace_usage(workspace_id: str):
    """
    Reset audits_used_this_month to 0 for a workspace subscription.
    Optionally accepts { audit_limit } in body to also update the limit.
    """
    try:
        update_data: dict = {"audits_used_this_month": 0, "updated_at": _now_utc().isoformat()}
        resp = supabase.table("subscriptions").update(update_data).eq(
            "workspace_id", workspace_id
        ).execute()
        if not resp.data:
            raise HTTPException(status_code=404, detail="Subscription not found for workspace")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"reset_workspace_usage error: {e}")
        raise HTTPException(status_code=500, detail="Failed to reset usage")

    return {"success": True, "workspace_id": workspace_id, "audits_used_this_month": 0}


# ─── Change user plan ─────────────────────────────────────────────────────────

@router.patch("/users/{user_id}/plan", dependencies=[Depends(verify_super_admin)])
async def change_user_plan(user_id: str, body: dict):
    """
    Change plan and audit limit for a user's workspace.
    Body: { workspace_id, plan, audit_limit }
    """
    workspace_id = body.get("workspace_id")
    plan = body.get("plan")
    audit_limit = body.get("audit_limit")

    if not workspace_id or not plan:
        raise HTTPException(status_code=400, detail="workspace_id and plan are required")

    valid_plans = ["free", "pro", "enterprise"]
    if plan not in valid_plans:
        raise HTTPException(status_code=400, detail=f"plan must be one of: {valid_plans}")

    update_data: dict = {"plan": plan, "updated_at": _now_utc().isoformat()}
    if audit_limit is not None:
        update_data["audit_limit"] = int(audit_limit)

    try:
        resp = supabase.table("subscriptions").update(update_data).eq(
            "workspace_id", workspace_id
        ).execute()
        if not resp.data:
            raise HTTPException(status_code=404, detail="Subscription not found for workspace")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"change_user_plan error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update subscription")

    return {"success": True, "workspace_id": workspace_id, "plan": plan}


# ─── Workspaces list ──────────────────────────────────────────────────────────

@router.get("/workspaces", dependencies=[Depends(verify_super_admin)])
async def list_admin_workspaces(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str = Query(""),
    db: AsyncSession = Depends(get_db),
):
    """List all workspaces with owner info, member counts, subscription."""
    try:
        ws_resp = supabase.table("workspaces").select("*").execute()
        all_ws = ws_resp.data or []
    except Exception as e:
        logger.error(f"list_admin_workspaces: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch workspaces")

    # Filter
    if search:
        q = search.lower()
        all_ws = [w for w in all_ws if q in w.get("name", "").lower() or q in w.get("slug", "").lower()]

    total = len(all_ws)
    offset = (page - 1) * per_page
    page_ws = all_ws[offset: offset + per_page]
    ws_ids = [w["id"] for w in page_ws]
    owner_ids = list({w["owner_id"] for w in page_ws if w.get("owner_id")})

    if not page_ws:
        return {"total": total, "page": page, "per_page": per_page, "items": []}

    # Owner emails
    owner_emails: dict[str, str] = {}
    for owner_id in owner_ids:
        try:
            u_resp = supabase.auth.admin.get_user_by_id(owner_id)
            if u_resp and u_resp.user:
                owner_emails[owner_id] = u_resp.user.email or ""
        except Exception:
            pass

    # Subscriptions
    try:
        subs_resp = supabase.table("subscriptions").select(
            "workspace_id,plan,status,audit_limit,audits_used_this_month"
        ).in_("workspace_id", ws_ids).execute()
        subs_by_ws: dict[str, dict] = {r["workspace_id"]: r for r in (subs_resp.data or [])}
    except Exception:
        subs_by_ws = {}

    # Member counts
    try:
        members_resp = supabase.table("workspace_members").select(
            "workspace_id"
        ).in_("workspace_id", ws_ids).execute()
        member_counts: dict[str, int] = {}
        for r in (members_resp.data or []):
            wid = r["workspace_id"]
            member_counts[wid] = member_counts.get(wid, 0) + 1
    except Exception:
        member_counts = {}

    # Project counts
    try:
        proj_resp = supabase.table("projects").select("workspace_id").in_(
            "workspace_id", ws_ids
        ).execute()
        project_counts: dict[str, int] = {}
        for r in (proj_resp.data or []):
            wid = r["workspace_id"]
            project_counts[wid] = project_counts.get(wid, 0) + 1
    except Exception:
        project_counts = {}

    # Audit counts from VPS PostgreSQL
    try:
        audit_rows = await db.execute(
            select(Audit.workspace_id, func.count(Audit.id).label("cnt"))
            .where(Audit.workspace_id.in_([UUID(w) for w in ws_ids]))
            .group_by(Audit.workspace_id)
        )
        audits_by_ws: dict[str, int] = {str(row.workspace_id): row.cnt for row in audit_rows}
    except Exception:
        audits_by_ws = {}

    items = []
    for ws in page_ws:
        wid = ws["id"]
        sub = subs_by_ws.get(wid, {})
        items.append({
            "id": wid,
            "name": ws.get("name", ""),
            "slug": ws.get("slug", ""),
            "type": ws.get("type", ""),
            "owner_id": ws.get("owner_id"),
            "owner_email": owner_emails.get(ws.get("owner_id", ""), ""),
            "created_at": ws.get("created_at"),
            "member_count": member_counts.get(wid, 0),
            "project_count": project_counts.get(wid, 0),
            "audit_count": audits_by_ws.get(wid, 0),
            "plan": sub.get("plan", "free"),
            "subscription_status": sub.get("status", "active"),
            "audit_limit": sub.get("audit_limit", 5),
            "audits_used_this_month": sub.get("audits_used_this_month", 0),
        })

    return {"total": total, "page": page, "per_page": per_page, "items": items}


# ─── Audits list ──────────────────────────────────────────────────────────────

@router.get("/audits", dependencies=[Depends(verify_super_admin)])
async def list_admin_audits(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    audit_status: Optional[str] = Query(None, alias="status"),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    List all audits across all workspaces with aggregate stats.
    """
    q = select(Audit).order_by(Audit.created_at.desc())

    if audit_status:
        q = q.where(Audit.status == audit_status)
    if date_from:
        q = q.where(Audit.created_at >= datetime.fromisoformat(date_from))
    if date_to:
        q = q.where(Audit.created_at <= datetime.fromisoformat(date_to))

    # Total count
    count_q = select(func.count()).select_from(q.subquery())
    total_result = await db.execute(count_q)
    total: int = total_result.scalar() or 0

    # Paginated results
    offset = (page - 1) * per_page
    page_result = await db.execute(q.offset(offset).limit(per_page))
    audits = page_result.scalars().all()

    # Aggregate stats (all filtered)
    stats_q = select(
        func.count(Audit.id).label("total"),
        func.avg(Audit.overall_score).label("avg_overall"),
        func.avg(Audit.seo_score).label("avg_seo"),
        func.avg(Audit.performance_score).label("avg_perf"),
        func.sum(
            case(
                (Audit.status == AuditStatus.COMPLETED, 1), else_=0
            )
        ).label("completed"),
        func.sum(
            case(
                (Audit.status == AuditStatus.FAILED, 1), else_=0
            )
        ).label("failed"),
    )
    if audit_status:
        stats_q = stats_q.where(Audit.status == audit_status)
    if date_from:
        stats_q = stats_q.where(Audit.created_at >= datetime.fromisoformat(date_from))
    if date_to:
        stats_q = stats_q.where(Audit.created_at <= datetime.fromisoformat(date_to))

    stats_result = await db.execute(stats_q)
    stats_row = stats_result.one()

    # Avg processing time
    duration_q = text(
        "SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60) "
        "FROM audits WHERE status = 'COMPLETED' AND started_at IS NOT NULL AND completed_at IS NOT NULL"
    )
    duration_result = await db.execute(duration_q)
    avg_duration = duration_result.scalar()

    # Collect workspace_ids to look up workspace names
    ws_ids = list({str(a.workspace_id) for a in audits if a.workspace_id})
    ws_names: dict[str, str] = {}
    if ws_ids:
        try:
            ws_resp = supabase.table("workspaces").select("id,name").in_("id", ws_ids).execute()
            ws_names = {r["id"]: r.get("name", "") for r in (ws_resp.data or [])}
        except Exception:
            pass

    items = [
        {
            "id": str(a.id),
            "url": a.url,
            "status": a.status.value if a.status else None,
            "overall_score": a.overall_score,
            "seo_score": a.seo_score,
            "performance_score": a.performance_score,
            "content_score": a.content_score,
            "workspace_id": str(a.workspace_id) if a.workspace_id else None,
            "workspace_name": ws_names.get(str(a.workspace_id), "") if a.workspace_id else "",
            "project_id": str(a.project_id) if a.project_id else None,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "started_at": a.started_at.isoformat() if a.started_at else None,
            "completed_at": a.completed_at.isoformat() if a.completed_at else None,
            "pdf_url": a.pdf_url,
            "ai_status": a.ai_status,
        }
        for a in audits
    ]

    success_rate = None
    if stats_row.total and stats_row.total > 0:
        success_rate = round((stats_row.completed or 0) / stats_row.total * 100, 1)

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "items": items,
        "aggregate": {
            "success_rate": success_rate,
            "avg_processing_minutes": round(float(avg_duration), 2) if avg_duration else None,
            "avg_overall_score": round(float(stats_row.avg_overall), 1) if stats_row.avg_overall else None,
            "avg_seo_score": round(float(stats_row.avg_seo), 1) if stats_row.avg_seo else None,
            "avg_performance_score": round(float(stats_row.avg_perf), 1) if stats_row.avg_perf else None,
            "completed": int(stats_row.completed or 0),
            "failed": int(stats_row.failed or 0),
        },
    }


@router.get("/audits/{audit_id}", dependencies=[Depends(verify_super_admin)])
async def get_admin_audit_detail(
    audit_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Read-only audit detail for super-admin diagnostics.
    """
    result = await db.execute(
        select(Audit)
        .options(selectinload(Audit.competitors))
        .where(Audit.id == audit_id)
    )
    audit = result.scalar_one_or_none()
    if not audit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit not found")

    return {
        "id": str(audit.id),
        "user_id": audit.user_id,
        "workspace_id": str(audit.workspace_id) if audit.workspace_id else None,
        "project_id": str(audit.project_id) if audit.project_id else None,
        "url": audit.url,
        "status": audit.status.value if hasattr(audit.status, "value") else audit.status,
        "ai_status": audit.ai_status,
        "execution_plan_status": audit.execution_plan_status,
        "processing_step": audit.processing_step,
        "processing_logs": audit.processing_logs,
        "progress_percent": None,
        "overall_score": audit.overall_score,
        "seo_score": audit.seo_score,
        "performance_score": audit.performance_score,
        "content_score": audit.content_score,
        "is_local_business": audit.is_local_business,
        "results": audit.results or {},
        "pdf_url": audit.pdf_url,
        "error_message": audit.error_message,
        "created_at": audit.created_at.isoformat() if audit.created_at else None,
        "started_at": audit.started_at.isoformat() if audit.started_at else None,
        "completed_at": audit.completed_at.isoformat() if audit.completed_at else None,
        "competitors": [
            {
                "id": str(c.id),
                "audit_id": str(c.audit_id) if c.audit_id else None,
                "url": c.url,
                "status": c.status.value if hasattr(c.status, "value") else c.status,
                "results": c.results or {},
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in (audit.competitors or [])
        ],
    }


@router.post("/impersonation/sessions", dependencies=[Depends(verify_super_admin)])
async def create_impersonation_session(
    body: ImpersonationSessionCreateRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a short-lived admin impersonation session scoped to a single audit.
    """
    result = await db.execute(select(Audit).where(Audit.id == body.audit_id))
    audit = result.scalar_one_or_none()
    if not audit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit not found")
    if not audit.workspace_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impersonation supports workspace-scoped audits only",
        )

    ws_resp = supabase.table("workspaces").select("owner_id").eq(
        "id", str(audit.workspace_id)
    ).execute()
    workspace_data = ws_resp.data or []
    subject_user_id = workspace_data[0].get("owner_id") if workspace_data else None
    if not subject_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workspace owner not found for impersonation scope",
        )

    ttl_minutes = body.ttl_minutes or settings.IMPERSONATION_TTL_MINUTES
    now_utc = _now_utc()
    expires_at = now_utc + timedelta(minutes=ttl_minutes)

    claims = {
        "type": "admin_impersonation",
        "jti": str(uuid.uuid4()),
        "actor_user_id": current_user["id"],
        "subject_user_id": subject_user_id,
        "audit_id": str(audit.id),
        "workspace_id": str(audit.workspace_id),
        "project_id": str(audit.project_id) if audit.project_id else None,
        "scopes": ["audits:read", "audits:export"],
        "iat": int(now_utc.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    token = jwt.encode(
        claims,
        settings.IMPERSONATION_JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )

    return {
        "impersonation_token": token,
        "expires_at": expires_at.isoformat(),
        "audit_id": str(audit.id),
        "workspace_id": str(audit.workspace_id),
        "project_id": str(audit.project_id) if audit.project_id else None,
    }


# ─── System status ────────────────────────────────────────────────────────────

@router.get("/system", dependencies=[Depends(verify_super_admin)])
async def get_admin_system(db: AsyncSession = Depends(get_db)):
    """System health status + pending queue count."""
    import subprocess
    from datetime import datetime as dt

    services: dict[str, dict] = {}

    # Screaming Frog
    services["screaming_frog"] = {"status": "online", "version": "Commercial/CLI", "error": None}

    # Lighthouse
    try:
        r = subprocess.run(
            ["docker", "exec", "sitespector-lighthouse", "lighthouse", "--version"],
            capture_output=True, text=True, timeout=5,
        )
        services["lighthouse"] = {
            "status": "online" if r.returncode == 0 else "offline",
            "version": r.stdout.strip() or None,
            "error": r.stderr if r.returncode != 0 else None,
        }
    except Exception as e:
        services["lighthouse"] = {"status": "error", "error": str(e)}

    # Worker
    try:
        r = subprocess.run(
            ["docker", "exec", "sitespector-worker", "pgrep", "-f", "worker.py"],
            capture_output=True, text=True, timeout=5,
        )
        services["worker"] = {
            "status": "online" if r.returncode == 0 else "offline",
            "pid": r.stdout.strip() or None,
        }
    except Exception as e:
        services["worker"] = {"status": "error", "error": str(e)}

    # PostgreSQL
    try:
        r = subprocess.run(
            ["docker", "exec", "sitespector-postgres", "pg_isready", "-U", "sitespector_user"],
            capture_output=True, text=True, timeout=5,
        )
        services["database"] = {
            "status": "online" if r.returncode == 0 else "offline",
            "message": r.stdout.strip(),
        }
    except Exception as e:
        services["database"] = {"status": "error", "error": str(e)}

    # Qdrant
    try:
        import httpx
        from app.config import settings as app_settings
        qdrant_url = app_settings.QDRANT_URL or "http://qdrant:6333"
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{qdrant_url}/collections")
            if resp.status_code == 200:
                collections = resp.json().get("result", {}).get("collections", [])
                services["qdrant"] = {"status": "online", "collections": len(collections), "error": None}
            else:
                services["qdrant"] = {"status": "error", "error": f"HTTP {resp.status_code}"}
    except Exception as e:
        services["qdrant"] = {"status": "offline", "error": str(e)}

    # Senuto
    try:
        from app.config import settings as app_settings
        if app_settings.SENUTO_EMAIL and app_settings.SENUTO_PASSWORD:
            services["senuto"] = {"status": "online", "version": "API v2"}
        else:
            services["senuto"] = {"status": "offline", "error": "Credentials missing"}
    except Exception as e:
        services["senuto"] = {"status": "error", "error": str(e)}

    # Pending queue
    try:
        pending_result = await db.execute(
            select(func.count(Audit.id)).where(
                Audit.status.in_([AuditStatus.PENDING, AuditStatus.PROCESSING])
            )
        )
        pending_queue = pending_result.scalar() or 0
    except Exception:
        pending_queue = 0

    return {
        "timestamp": dt.utcnow().isoformat(),
        "services": services,
        "worker_queue": {"pending": pending_queue},
    }
