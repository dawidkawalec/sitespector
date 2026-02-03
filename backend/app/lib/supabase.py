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
