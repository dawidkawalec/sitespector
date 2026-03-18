"""
Credits API endpoints — balance, transactions, packages, purchases.
"""

import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.database import get_db
from app.auth_supabase import get_current_user, verify_workspace_access
from app.lib.supabase import get_workspace_subscription
from app.services.credit_service import (
    get_balance,
    get_transaction_history,
    calculate_audit_cost,
    can_purchase_credits,
    CREDIT_PACKAGES,
    PLAN_CREDITS,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/credits", tags=["Credits"])


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class CreditBalanceResponse(BaseModel):
    subscription_credits: int
    purchased_credits: int
    total: int
    plan: str
    credits_per_cycle: int


class CreditTransactionResponse(BaseModel):
    id: str
    type: str
    amount: int
    balance_after: int
    metadata: Optional[Dict[str, Any]] = None
    created_at: str


class CreditPackageResponse(BaseModel):
    id: str
    label: str
    credits: int
    price_cents: int


class CostEstimateResponse(BaseModel):
    total_cost: int
    breakdown: Dict[str, int]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/balance", response_model=CreditBalanceResponse)
async def get_credit_balance(
    workspace_id: str = Query(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get credit balance for workspace."""
    has_access = await verify_workspace_access(current_user["id"], workspace_id)
    if not has_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    balance = await get_balance(db, workspace_id)
    subscription = await get_workspace_subscription(workspace_id)
    plan = subscription["plan"] if subscription else "free"

    return CreditBalanceResponse(
        subscription_credits=balance.subscription_credits or 0,
        purchased_credits=balance.purchased_credits or 0,
        total=balance.total,
        plan=plan,
        credits_per_cycle=PLAN_CREDITS.get(plan, 0),
    )


@router.get("/transactions", response_model=List[CreditTransactionResponse])
async def list_credit_transactions(
    workspace_id: str = Query(...),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get paginated credit transaction history."""
    has_access = await verify_workspace_access(current_user["id"], workspace_id)
    if not has_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    transactions = await get_transaction_history(db, workspace_id, limit=limit, offset=offset)
    return [
        CreditTransactionResponse(
            id=str(tx.id),
            type=tx.type,
            amount=tx.amount,
            balance_after=tx.balance_after,
            metadata=tx.metadata,
            created_at=tx.created_at.isoformat() if tx.created_at else "",
        )
        for tx in transactions
    ]


@router.get("/packages", response_model=List[CreditPackageResponse])
async def list_credit_packages():
    """Get available credit packages."""
    return [
        CreditPackageResponse(
            id=pkg_id,
            label=pkg["label"],
            credits=pkg["credits"],
            price_cents=pkg["price_cents"],
        )
        for pkg_id, pkg in CREDIT_PACKAGES.items()
    ]


@router.get("/cost-estimate", response_model=CostEstimateResponse)
async def get_cost_estimate(
    run_ai_pipeline: bool = Query(True),
    competitors_count: int = Query(0, ge=0, le=10),
):
    """Get estimated credit cost for an audit configuration."""
    total = calculate_audit_cost(run_ai_pipeline, competitors_count)
    tech = 20
    ai = 10 if run_ai_pipeline else 0
    competitors = competitors_count * 3

    return CostEstimateResponse(
        total_cost=total,
        breakdown={"tech": tech, "ai": ai, "competitors": competitors},
    )
