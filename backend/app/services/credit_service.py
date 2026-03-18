"""
Credit system service — universal credit currency for SiteSpector.

All credit operations go through this module. Uses SELECT FOR UPDATE
to prevent race conditions on concurrent deductions.
"""

import logging
import uuid as _uuid
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import CreditBalance, CreditTransaction

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

PLAN_CREDITS: Dict[str, int] = {
    "free": 50,        # one-time grant on signup
    "solo": 100,       # per billing cycle
    "pro": 100,        # legacy alias for solo
    "agency": 400,     # per billing cycle
    "enterprise": 2000,  # per billing cycle
}

COSTS: Dict[str, int] = {
    "audit_full": 30,       # 20 tech + 10 AI
    "audit_tech_only": 20,  # tech without AI pipeline
    "chat_message": 1,
    "competitor_audit": 3,
}

CREDIT_PACKAGES: Dict[str, Dict[str, Any]] = {
    "starter":  {"credits": 50,   "price_cents": 499,  "label": "Starter"},
    "standard": {"credits": 150,  "price_cents": 1299, "label": "Standard"},
    "pro":      {"credits": 500,  "price_cents": 3499, "label": "Pro"},
    "agency":   {"credits": 1500, "price_cents": 8999, "label": "Agency"},
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _as_uuid(value: Any) -> _uuid.UUID:
    if isinstance(value, _uuid.UUID):
        return value
    return _uuid.UUID(str(value))


def calculate_audit_cost(run_ai_pipeline: bool = True, competitors_count: int = 0) -> int:
    """Return total credit cost for an audit."""
    base = COSTS["audit_full"] if run_ai_pipeline else COSTS["audit_tech_only"]
    return base + competitors_count * COSTS["competitor_audit"]


# ---------------------------------------------------------------------------
# Balance operations
# ---------------------------------------------------------------------------

async def get_balance(db: AsyncSession, workspace_id: str) -> CreditBalance:
    """
    Get credit balance for workspace. Creates a row with 0/0 if none exists.
    Does NOT lock the row (read-only).
    """
    ws_uuid = _as_uuid(workspace_id)
    result = await db.execute(
        select(CreditBalance).where(CreditBalance.workspace_id == ws_uuid)
    )
    balance = result.scalar_one_or_none()

    if balance is None:
        balance = CreditBalance(
            workspace_id=ws_uuid,
            subscription_credits=0,
            purchased_credits=0,
        )
        db.add(balance)
        await db.flush()

    return balance


async def get_balance_for_update(db: AsyncSession, workspace_id: str) -> CreditBalance:
    """
    Get credit balance with row-level lock (SELECT ... FOR UPDATE).
    Must be called within a transaction.
    """
    ws_uuid = _as_uuid(workspace_id)
    result = await db.execute(
        select(CreditBalance)
        .where(CreditBalance.workspace_id == ws_uuid)
        .with_for_update()
    )
    balance = result.scalar_one_or_none()

    if balance is None:
        balance = CreditBalance(
            workspace_id=ws_uuid,
            subscription_credits=0,
            purchased_credits=0,
        )
        db.add(balance)
        await db.flush()
        # Re-lock the newly created row
        result = await db.execute(
            select(CreditBalance)
            .where(CreditBalance.workspace_id == ws_uuid)
            .with_for_update()
        )
        balance = result.scalar_one()

    return balance


async def check_credits(db: AsyncSession, workspace_id: str, required: int) -> bool:
    """Check if workspace has enough credits (read-only, no lock)."""
    balance = await get_balance(db, workspace_id)
    return balance.total >= required


# ---------------------------------------------------------------------------
# Deduction / Grant
# ---------------------------------------------------------------------------

async def deduct_credits(
    db: AsyncSession,
    workspace_id: str,
    user_id: str,
    amount: int,
    tx_type: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> CreditTransaction:
    """
    Atomically deduct credits from workspace balance.

    Consumes subscription_credits first, then purchased_credits.
    Raises HTTPException(402) if insufficient balance.
    """
    if amount <= 0:
        raise ValueError("Deduction amount must be positive")

    balance = await get_balance_for_update(db, workspace_id)

    if balance.total < amount:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Niewystarczające kredyty. Potrzeba: {amount} kr, saldo: {balance.total} kr.",
        )

    # Consume subscription credits first
    remaining = amount
    sub_deduct = min(remaining, balance.subscription_credits or 0)
    balance.subscription_credits = (balance.subscription_credits or 0) - sub_deduct
    remaining -= sub_deduct

    if remaining > 0:
        balance.purchased_credits = (balance.purchased_credits or 0) - remaining

    # Create transaction record
    tx = CreditTransaction(
        workspace_id=_as_uuid(workspace_id),
        user_id=_as_uuid(user_id),
        type=tx_type,
        amount=-amount,
        balance_after=balance.total,
        metadata=metadata,
    )
    db.add(tx)
    await db.flush()

    logger.info(
        "Deducted %d credits from workspace %s (type=%s, balance_after=%d)",
        amount, workspace_id, tx_type, balance.total,
    )
    return tx


async def grant_credits(
    db: AsyncSession,
    workspace_id: str,
    user_id: str,
    amount: int,
    tx_type: str,
    metadata: Optional[Dict[str, Any]] = None,
    *,
    target: str = "subscription",
) -> CreditTransaction:
    """
    Grant credits to workspace. target = 'subscription' or 'purchased'.
    """
    if amount <= 0:
        raise ValueError("Grant amount must be positive")

    balance = await get_balance_for_update(db, workspace_id)

    if target == "purchased":
        balance.purchased_credits = (balance.purchased_credits or 0) + amount
    else:
        balance.subscription_credits = (balance.subscription_credits or 0) + amount

    tx = CreditTransaction(
        workspace_id=_as_uuid(workspace_id),
        user_id=_as_uuid(user_id),
        type=tx_type,
        amount=amount,
        balance_after=balance.total,
        metadata=metadata,
    )
    db.add(tx)
    await db.flush()

    logger.info(
        "Granted %d credits to workspace %s (type=%s, target=%s, balance_after=%d)",
        amount, workspace_id, tx_type, target, balance.total,
    )
    return tx


async def reset_subscription_credits(
    db: AsyncSession,
    workspace_id: str,
    new_amount: int,
    user_id: Optional[str] = None,
) -> CreditTransaction:
    """
    Reset subscription credits for a new billing cycle.
    Zeroes subscription_credits and sets to new_amount.
    Purchased credits are untouched.
    """
    balance = await get_balance_for_update(db, workspace_id)

    old_sub = balance.subscription_credits or 0
    balance.subscription_credits = new_amount

    # Use system user if no user_id provided (webhook context)
    uid = _as_uuid(user_id) if user_id else _as_uuid("00000000-0000-0000-0000-000000000000")

    tx = CreditTransaction(
        workspace_id=_as_uuid(workspace_id),
        user_id=uid,
        type="grant_subscription",
        amount=new_amount,  # net grant for the new cycle
        balance_after=balance.total,
        metadata={"old_subscription_credits": old_sub, "new_subscription_credits": new_amount},
    )
    db.add(tx)
    await db.flush()

    logger.info(
        "Reset subscription credits for workspace %s: %d → %d (purchased unchanged: %d)",
        workspace_id, old_sub, new_amount, balance.purchased_credits,
    )
    return tx


# ---------------------------------------------------------------------------
# Transaction history
# ---------------------------------------------------------------------------

async def get_transaction_history(
    db: AsyncSession,
    workspace_id: str,
    limit: int = 20,
    offset: int = 0,
) -> List[CreditTransaction]:
    """Get paginated transaction history for workspace, newest first."""
    ws_uuid = _as_uuid(workspace_id)
    result = await db.execute(
        select(CreditTransaction)
        .where(CreditTransaction.workspace_id == ws_uuid)
        .order_by(desc(CreditTransaction.created_at))
        .limit(limit)
        .offset(offset)
    )
    return list(result.scalars().all())


# ---------------------------------------------------------------------------
# Package purchase helper
# ---------------------------------------------------------------------------

async def can_purchase_credits(plan: str) -> bool:
    """Check if a plan allows purchasing credit packages. Free cannot."""
    return plan not in ("free",)
