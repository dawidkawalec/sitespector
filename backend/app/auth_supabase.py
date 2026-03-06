"""
Supabase authentication utilities.

This module replaces the legacy JWT authentication (auth.py) with Supabase Auth.
"""

from fastapi import Depends, Header, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.lib.supabase import (
    supabase,
    get_project,
    verify_workspace_membership,
    verify_project_membership,
)
from typing import Optional
import logging
import re
from jose import JWTError, jwt
from app.config import settings

logger = logging.getLogger(__name__)

# JWT Bearer token scheme
security = HTTPBearer()

IMPERSONATION_ALLOWED_PATHS = [
    re.compile(r"^/api/audits/(?P<audit_id>[0-9a-fA-F-]+)$"),
    re.compile(r"^/api/audits/(?P<audit_id>[0-9a-fA-F-]+)/status$"),
    re.compile(r"^/api/audits/(?P<audit_id>[0-9a-fA-F-]+)/pdf$"),
    re.compile(r"^/api/audits/(?P<audit_id>[0-9a-fA-F-]+)/raw$"),
]


def _normalize_path(path: str) -> str:
    if path != "/" and path.endswith("/"):
        return path[:-1]
    return path


def _decode_impersonation_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            settings.IMPERSONATION_JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired impersonation token",
        ) from e

    if payload.get("type") != "admin_impersonation":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid impersonation token type",
        )
    return payload


def _enforce_impersonation_policy(method: str, path: str, payload: dict) -> None:
    if method.upper() != "GET":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Impersonation session allows read-only requests only",
        )

    normalized_path = _normalize_path(path)
    for pattern in IMPERSONATION_ALLOWED_PATHS:
        match = pattern.fullmatch(normalized_path)
        if not match:
            continue

        requested_audit_id = match.group("audit_id")
        token_audit_id = str(payload.get("audit_id") or "")
        if requested_audit_id != token_audit_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Impersonation session is scoped to a different audit",
            )
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Endpoint not allowed in impersonation session",
    )


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    x_impersonation_token: Optional[str] = Header(default=None, alias="X-Impersonation-Token"),
) -> dict:
    """
    Get current user from Supabase JWT token.
    
    Verifies the token with Supabase Auth and returns user information.
    
    Args:
        credentials: HTTP Bearer credentials with Supabase JWT
    
    Returns:
        Dict with user info: {id, email, user_metadata}
    
    Raises:
        HTTPException: If token is invalid or expired
    """
    token = credentials.credentials
    
    try:
        # Verify token with Supabase
        response = supabase.auth.get_user(token)
        user = response.user
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        actor_user = {
            "id": user.id,
            "email": user.email,
            "user_metadata": user.user_metadata or {},
            "is_impersonating": False,
            "impersonation": None,
        }

        if not x_impersonation_token:
            return actor_user

        payload = _decode_impersonation_token(x_impersonation_token)
        if payload.get("actor_user_id") != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Impersonation token does not belong to current actor",
            )

        _enforce_impersonation_policy(request.method, request.url.path, payload)

        subject_user_id = payload.get("subject_user_id")
        if not subject_user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid impersonation subject",
            )

        return {
            "id": subject_user_id,
            "email": user.email,
            "user_metadata": user.user_metadata or {},
            "is_impersonating": True,
            "impersonation": {
                "actor_user_id": payload.get("actor_user_id"),
                "subject_user_id": subject_user_id,
                "audit_id": payload.get("audit_id"),
                "workspace_id": payload.get("workspace_id"),
                "project_id": payload.get("project_id"),
                "scopes": payload.get("scopes", []),
                "exp": payload.get("exp"),
            },
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_active_user(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Get current active user (alias for get_current_user).
    
    This function exists for compatibility with existing code.
    Future: Add additional checks (banned users, etc.)
    
    Args:
        current_user: Current user dict from get_current_user
    
    Returns:
        Current active user dict
    """
    return current_user


async def verify_workspace_access(
    user_id: str,
    workspace_id: str,
    required_role: Optional[str] = None
) -> bool:
    """
    Verify user has access to workspace with optional role requirement.
    
    Args:
        user_id: Supabase user UUID
        workspace_id: Workspace UUID
        required_role: Optional role requirement ('owner', 'admin', 'member')
    
    Returns:
        True if user has access, False otherwise
    """
    try:
        response = supabase.table("workspace_members").select("role").eq(
            "workspace_id", workspace_id
        ).eq("user_id", user_id).execute()
        
        if not response.data:
            return False
        
        membership = response.data[0]
        
        # Check role requirement
        if required_role:
            role_hierarchy = {"owner": 3, "admin": 2, "member": 1}
            user_role_level = role_hierarchy.get(membership["role"], 0)
            required_role_level = role_hierarchy.get(required_role, 0)
            
            return user_role_level >= required_role_level
        
        return True
    
    except Exception as e:
        logger.error(f"Error verifying workspace access: {str(e)}")
        return False


async def verify_project_access(
    user_id: str,
    project_id: str,
    workspace_id: str,
    required_role: Optional[str] = None,
) -> bool:
    """
    Verify user has access to project with optional project-level role requirement.

    - Workspace owner/admin: implicit access to all projects (bypass project_members).
    - Workspace member: must be in project_members for this project.
    - If required_role is set, enforce project role hierarchy: manager(3) > member(2) > viewer(1).

    Args:
        user_id: Supabase user UUID
        project_id: Project UUID
        workspace_id: Workspace UUID (must match project's workspace)
        required_role: Optional project role requirement ('manager', 'member', 'viewer')

    Returns:
        True if user has access, False otherwise
    """
    try:
        project = await get_project(project_id)
        if not project or str(project.get("workspace_id")) != str(workspace_id):
            return False

        ws_membership = await verify_workspace_membership(user_id, workspace_id)
        if not ws_membership:
            return False

        ws_role = ws_membership.get("role")
        if ws_role in ("owner", "admin"):
            # Implicit access; still check required_role if we need project-level role.
            # Owner/admin are treated as having effective "manager" for project role checks.
            if required_role:
                role_hierarchy = {"manager": 3, "member": 2, "viewer": 1}
                required_level = role_hierarchy.get(required_role, 0)
                return required_level <= 3  # owner/admin can do anything
            return True

        # Workspace member: must be in project_members
        pm = await verify_project_membership(user_id, project_id, required_role)
        return pm is not None

    except Exception as e:
        logger.error(f"Error verifying project access: {str(e)}")
        return False


def require_workspace_membership(required_role: Optional[str] = None):
    """
    Dependency to verify workspace membership.
    
    Usage:
        @router.post("/audits")
        async def create_audit(
            workspace_id: str = Query(...),
            current_user: dict = Depends(get_current_user),
            _: bool = Depends(require_workspace_membership())
        ):
            # User is verified as workspace member
    
    Args:
        required_role: Optional role requirement
    
    Returns:
        Dependency function
    """
    async def verify(
        workspace_id: str,
        current_user: dict = Depends(get_current_user)
    ) -> bool:
        has_access = await verify_workspace_access(
            current_user["id"],
            workspace_id,
            required_role
        )
        
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Not authorized to access this workspace"
            )
        
        return True
    
    return verify
