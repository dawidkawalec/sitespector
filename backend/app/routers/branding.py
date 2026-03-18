"""
Branding API endpoints — workspace branding settings for PDF white-label.
"""

import logging
import re
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from pydantic import BaseModel, field_validator

from app.auth_supabase import get_current_user, verify_workspace_access
from app.lib.supabase import (
    get_workspace_branding,
    update_workspace_branding,
    get_workspace_subscription,
    supabase,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/branding", tags=["Branding"])

HEX_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")
MAX_LOGO_SIZE = 2 * 1024 * 1024  # 2 MB
ALLOWED_MIME_TYPES = {"image/png", "image/jpeg", "image/svg+xml", "image/webp"}


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class BrandingResponse(BaseModel):
    branding_logo_url: Optional[str] = None
    branding_company_name: Optional[str] = None
    branding_contact_email: Optional[str] = None
    branding_contact_url: Optional[str] = None
    branding_accent_color: Optional[str] = None


class BrandingUpdate(BaseModel):
    branding_company_name: Optional[str] = None
    branding_contact_email: Optional[str] = None
    branding_contact_url: Optional[str] = None
    branding_accent_color: Optional[str] = None

    @field_validator("branding_accent_color")
    @classmethod
    def validate_hex_color(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v != "" and not HEX_COLOR_RE.match(v):
            raise ValueError("Accent color must be a valid hex color (#RRGGBB)")
        return v or None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=BrandingResponse)
async def get_branding(
    workspace_id: str = Query(..., description="Workspace ID"),
    current_user: dict = Depends(get_current_user),
):
    """Get branding settings for workspace."""
    has_access = await verify_workspace_access(current_user["id"], workspace_id)
    if not has_access:
        raise HTTPException(status_code=403, detail="No access to workspace")

    branding = await get_workspace_branding(workspace_id)
    return BrandingResponse(**branding)


@router.patch("", response_model=BrandingResponse)
async def update_branding(
    body: BrandingUpdate,
    workspace_id: str = Query(..., description="Workspace ID"),
    current_user: dict = Depends(get_current_user),
):
    """Update branding settings (owner/admin only). Enterprise plan: all fields. Agency plan: logo only."""
    has_access = await verify_workspace_access(
        current_user["id"], workspace_id, required_role="admin"
    )
    if not has_access:
        raise HTTPException(status_code=403, detail="Admin access required")

    # Plan gating: only enterprise can set company_name, contact, colors
    subscription = await get_workspace_subscription(workspace_id)
    plan = (subscription or {}).get("plan", "free")

    updates = body.model_dump(exclude_unset=True)

    enterprise_fields = {
        "branding_company_name",
        "branding_contact_email",
        "branding_contact_url",
        "branding_accent_color",
    }

    if plan != "enterprise":
        blocked = [k for k in updates if k in enterprise_fields and updates[k] is not None]
        if blocked:
            raise HTTPException(
                status_code=403,
                detail=f"White-label branding requires Enterprise plan. Blocked fields: {', '.join(blocked)}",
            )

    branding = await update_workspace_branding(workspace_id, updates)
    return BrandingResponse(**branding)


@router.post("/logo", response_model=BrandingResponse)
async def upload_branding_logo(
    workspace_id: str = Query(..., description="Workspace ID"),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Upload branding logo. Agency+ plan required."""
    has_access = await verify_workspace_access(
        current_user["id"], workspace_id, required_role="admin"
    )
    if not has_access:
        raise HTTPException(status_code=403, detail="Admin access required")

    # Plan gating: agency+ can upload logo
    subscription = await get_workspace_subscription(workspace_id)
    plan = (subscription or {}).get("plan", "free")
    if plan in ("free", "solo"):
        raise HTTPException(
            status_code=403,
            detail="Logo branding requires Agency or Enterprise plan",
        )

    # Validate file
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Allowed: PNG, JPEG, SVG, WebP",
        )

    content = await file.read()
    if len(content) > MAX_LOGO_SIZE:
        raise HTTPException(status_code=400, detail="Logo file too large (max 2 MB)")

    # Upload to Supabase Storage
    ext = (file.filename or "logo.png").rsplit(".", 1)[-1] if file.filename else "png"
    storage_path = f"{workspace_id}/logo.{ext}"

    try:
        # Remove old logo if exists
        supabase.storage.from_("branding-logos").remove([storage_path])
    except Exception:
        pass

    try:
        supabase.storage.from_("branding-logos").upload(
            storage_path,
            content,
            file_options={"content-type": file.content_type, "upsert": "true"},
        )
    except Exception as e:
        logger.error(f"Logo upload failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload logo")

    # Get public URL
    public_url = supabase.storage.from_("branding-logos").get_public_url(storage_path)

    # Save URL to workspace
    branding = await update_workspace_branding(
        workspace_id, {"branding_logo_url": public_url}
    )
    return BrandingResponse(**branding)


@router.delete("/logo", response_model=BrandingResponse)
async def delete_branding_logo(
    workspace_id: str = Query(..., description="Workspace ID"),
    current_user: dict = Depends(get_current_user),
):
    """Remove branding logo."""
    has_access = await verify_workspace_access(
        current_user["id"], workspace_id, required_role="admin"
    )
    if not has_access:
        raise HTTPException(status_code=403, detail="Admin access required")

    # Try to remove files from storage
    try:
        files = supabase.storage.from_("branding-logos").list(workspace_id)
        if files:
            paths = [f"{workspace_id}/{f['name']}" for f in files]
            supabase.storage.from_("branding-logos").remove(paths)
    except Exception:
        pass

    branding = await update_workspace_branding(
        workspace_id, {"branding_logo_url": None}
    )
    return BrandingResponse(**branding)
