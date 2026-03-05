from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth_supabase import verify_project_access, verify_workspace_access
from app.models import Audit


async def get_audit_with_access(
    db: AsyncSession,
    audit_id: UUID,
    user_id: str,
    *,
    include_competitors: bool = False,
    required_workspace_role: str | None = None,
) -> Audit:
    """Load an audit and enforce full ACL checks (workspace + project + legacy fallback)."""
    query = select(Audit).where(Audit.id == audit_id)
    if include_competitors:
        query = query.options(selectinload(Audit.competitors))

    result = await db.execute(query)
    audit = result.scalar_one_or_none()
    if not audit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit not found",
        )

    if audit.workspace_id:
        has_workspace_access = await verify_workspace_access(
            user_id,
            str(audit.workspace_id),
            required_role=required_workspace_role,
        )
        if not has_workspace_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this audit",
            )

        if audit.project_id:
            has_project_access = await verify_project_access(
                user_id,
                str(audit.project_id),
                str(audit.workspace_id),
            )
            if not has_project_access:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to access this audit",
                )
    elif audit.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this audit",
        )

    return audit
