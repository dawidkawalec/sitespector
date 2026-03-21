"""
Action card endpoints: CRUD + AI generation for persona dashboard.
"""

import logging
from datetime import datetime
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import Audit, ActionCard
from app.schemas import ActionCardCreate, ActionCardUpdate, ActionCardResponse
from app.auth_supabase import get_current_user, verify_workspace_access

logger = logging.getLogger(__name__)

router = APIRouter(tags=["ActionCards"])


async def _verify_audit_access(audit_id: UUID, user: dict, db: AsyncSession) -> Audit:
    result = await db.execute(select(Audit).where(Audit.id == audit_id))
    audit = result.scalar_one_or_none()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    if audit.workspace_id:
        await verify_workspace_access(user["id"], str(audit.workspace_id))
    return audit


@router.get("/audits/{audit_id}/action-cards", response_model=List[ActionCardResponse])
async def list_action_cards(
    audit_id: UUID,
    card_status: Optional[str] = Query(None, alias="status"),
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List action cards for an audit, optionally filtered by status."""
    await _verify_audit_access(audit_id, user, db)

    query = select(ActionCard).where(ActionCard.audit_id == audit_id)
    if card_status:
        query = query.where(ActionCard.status == card_status)
    query = query.order_by(ActionCard.sort_order, ActionCard.created_at)

    result = await db.execute(query)
    return result.scalars().all()


@router.post("/audits/{audit_id}/action-cards", response_model=ActionCardResponse, status_code=status.HTTP_201_CREATED)
async def create_action_card(
    audit_id: UUID,
    data: ActionCardCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create an action card (manual or from chat)."""
    audit = await _verify_audit_access(audit_id, user, db)

    card = ActionCard(
        audit_id=audit_id,
        persona_id=audit.persona_id,
        title=data.title,
        description=data.description,
        category=data.category,
        priority=data.priority,
        kpi_impact=data.kpi_impact,
        action_data=data.action_data,
        source=data.source,
    )
    db.add(card)
    await db.commit()
    await db.refresh(card)
    return card


@router.patch("/audits/{audit_id}/action-cards/{card_id}", response_model=ActionCardResponse)
async def update_action_card(
    audit_id: UUID,
    card_id: UUID,
    data: ActionCardUpdate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an action card (status, priority, etc.)."""
    await _verify_audit_access(audit_id, user, db)

    result = await db.execute(
        select(ActionCard).where(ActionCard.id == card_id, ActionCard.audit_id == audit_id)
    )
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=404, detail="Action card not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(card, field, value)

    if data.status == "completed" and not card.completed_at:
        card.completed_at = datetime.utcnow()

    await db.commit()
    await db.refresh(card)
    return card


@router.delete("/audits/{audit_id}/action-cards/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_action_card(
    audit_id: UUID,
    card_id: UUID,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an action card."""
    await _verify_audit_access(audit_id, user, db)

    result = await db.execute(
        select(ActionCard).where(ActionCard.id == card_id, ActionCard.audit_id == audit_id)
    )
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(status_code=404, detail="Action card not found")

    await db.delete(card)
    await db.commit()


@router.post("/audits/{audit_id}/action-cards/generate", response_model=List[ActionCardResponse])
async def generate_action_cards_endpoint(
    audit_id: UUID,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Manually trigger AI action card generation for an audit."""
    audit = await _verify_audit_access(audit_id, user, db)

    if not audit.results or audit.ai_status != "completed":
        raise HTTPException(status_code=400, detail="Audit AI analysis not completed yet")

    from app.services.action_card_service import generate_action_cards
    cards = await generate_action_cards(db, audit_id, audit.persona_id)
    return cards
