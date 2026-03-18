"""
Supabase client for backend operations.

Used for:
- Verifying JWT tokens from Supabase Auth
- Querying workspace membership and permissions
- Checking subscription limits
- Admin operations (user migration)
"""

from supabase import create_client, Client
from app.config import settings
from functools import lru_cache


@lru_cache()
def get_supabase_client() -> Client:
    """
    Get Supabase client (cached).
    
    Uses service role key for admin operations.
    """
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_KEY
    )


# Global instance
supabase: Client = get_supabase_client()


async def verify_workspace_membership(
    user_id: str,
    workspace_id: str,
    required_role: str | None = None
) -> dict | None:
    """
    Verify user is a member of workspace.
    
    Args:
        user_id: Supabase user UUID
        workspace_id: Workspace UUID
        required_role: Optional role requirement ('owner', 'admin', 'member')
    
    Returns:
        Membership dict with role, or None if not a member
    """
    response = supabase.table("workspace_members").select("*").eq(
        "workspace_id", workspace_id
    ).eq("user_id", user_id).execute()
    
    if not response.data:
        return None
    
    membership = response.data[0]
    
    # Check role requirement
    if required_role:
        role_hierarchy = {"owner": 3, "admin": 2, "member": 1}
        user_role_level = role_hierarchy.get(membership["role"], 0)
        required_role_level = role_hierarchy.get(required_role, 0)
        
        if user_role_level < required_role_level:
            return None
    
    return membership


async def get_workspace_subscription(workspace_id: str) -> dict | None:
    """
    Get subscription data for workspace.
    
    Args:
        workspace_id: Workspace UUID
    
    Returns:
        Subscription dict or None if not found
    """
    response = supabase.table("subscriptions").select("*").eq(
        "workspace_id", workspace_id
    ).execute()
    
    if not response.data:
        return None
    
    return response.data[0]


async def increment_audit_usage(workspace_id: str) -> None:
    """
    Increment audit usage counter for workspace.
    
    Args:
        workspace_id: Workspace UUID
    """
    subscription = await get_workspace_subscription(workspace_id)
    
    if subscription:
        supabase.table("subscriptions").update({
            "audits_used_this_month": subscription["audits_used_this_month"] + 1
        }).eq("workspace_id", workspace_id).execute()


async def check_audit_limit(workspace_id: str) -> bool:
    """
    Check if workspace has reached audit limit.
    
    Args:
        workspace_id: Workspace UUID
    
    Returns:
        True if under limit, False if limit reached
    """
    subscription = await get_workspace_subscription(workspace_id)
    
    if not subscription:
        return False
    
    return subscription["audits_used_this_month"] < subscription["audit_limit"]


# --- Branding helpers ---


BRANDING_FIELDS = (
    "branding_logo_url",
    "branding_company_name",
    "branding_contact_email",
    "branding_contact_url",
    "branding_accent_color",
)

BRANDING_DEFAULTS = {
    "branding_logo_url": None,
    "branding_company_name": None,
    "branding_contact_email": None,
    "branding_contact_url": None,
    "branding_accent_color": None,
}


async def get_workspace_branding(workspace_id: str) -> dict:
    """
    Fetch branding settings for workspace.
    Returns dict with branding_* fields (None if not set).
    """
    fields = ",".join(BRANDING_FIELDS)
    response = supabase.table("workspaces").select(fields).eq(
        "id", workspace_id
    ).execute()

    if not response.data:
        return dict(BRANDING_DEFAULTS)

    row = response.data[0]
    return {k: row.get(k) for k in BRANDING_FIELDS}


async def update_workspace_branding(workspace_id: str, updates: dict) -> dict:
    """
    Update branding settings for workspace.
    Only accepts known branding_* fields.
    Returns updated branding dict.
    """
    safe_updates = {k: v for k, v in updates.items() if k in BRANDING_FIELDS}
    if not safe_updates:
        return await get_workspace_branding(workspace_id)

    supabase.table("workspaces").update(safe_updates).eq(
        "id", workspace_id
    ).execute()

    return await get_workspace_branding(workspace_id)


# --- Project helpers ---


async def get_project(project_id: str) -> dict | None:
    """
    Fetch project record by ID.
    
    Args:
        project_id: Project UUID
    
    Returns:
        Project dict or None if not found
    """
    response = supabase.table("projects").select("*").eq("id", project_id).execute()
    if not response.data:
        return None
    return response.data[0]


async def get_project_members(project_id: str) -> list[dict]:
    """
    List project members.
    
    Args:
        project_id: Project UUID
    
    Returns:
        List of project_members rows
    """
    response = supabase.table("project_members").select("*").eq(
        "project_id", project_id
    ).execute()
    return response.data or []


async def verify_project_membership(
    user_id: str,
    project_id: str,
    required_role: str | None = None,
) -> dict | None:
    """
    Check if user is a project member with optional role requirement.
    
    Args:
        user_id: Supabase user UUID
        project_id: Project UUID
        required_role: Optional role requirement ('manager', 'member', 'viewer')
    
    Returns:
        Membership dict with role, or None if not a member / role insufficient
    """
    response = supabase.table("project_members").select("*").eq(
        "project_id", project_id
    ).eq("user_id", user_id).execute()
    
    if not response.data:
        return None
    
    membership = response.data[0]
    
    if required_role:
        role_hierarchy = {"manager": 3, "member": 2, "viewer": 1}
        user_role_level = role_hierarchy.get(membership["role"], 0)
        required_role_level = role_hierarchy.get(required_role, 0)
        if user_role_level < required_role_level:
            return None
    
    return membership
