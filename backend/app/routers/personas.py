"""
Persona endpoints: list system + workspace personas.
"""

import logging
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.database import get_db
from app.models import Persona
from app.schemas import PersonaResponse
from app.auth_supabase import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/personas", tags=["Personas"])


@router.get("", response_model=List[PersonaResponse])
async def list_personas(
    workspace_id: Optional[UUID] = Query(None),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List system personas + workspace-specific ones (if workspace_id given)."""
    conditions = [Persona.is_system == True]
    if workspace_id:
        conditions.append(Persona.workspace_id == workspace_id)

    result = await db.execute(
        select(Persona)
        .where(or_(*conditions))
        .order_by(Persona.sort_order, Persona.name)
    )
    return result.scalars().all()


@router.get("/{slug}", response_model=PersonaResponse)
async def get_persona(
    slug: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single persona by slug."""
    result = await db.execute(select(Persona).where(Persona.slug == slug))
    persona = result.scalar_one_or_none()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    return persona
