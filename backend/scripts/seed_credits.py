"""
One-time seed script: create credit_balances rows for existing workspaces.

Run on VPS after Alembic migration:
    docker exec sitespector-backend python -m scripts.seed_credits
"""

import asyncio
import logging
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import AsyncSessionLocal
from app.models import CreditBalance, CreditTransaction
from app.services.credit_service import PLAN_CREDITS, _as_uuid
from app.lib.supabase import supabase

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def seed():
    """Seed credit balances for all existing workspaces."""

    # Fetch all subscriptions from Supabase
    response = supabase.table("subscriptions").select("workspace_id, plan").execute()
    subscriptions = response.data or []

    logger.info("Found %d workspaces to seed", len(subscriptions))

    async with AsyncSessionLocal() as db:
        created = 0
        skipped = 0

        for sub in subscriptions:
            workspace_id = sub["workspace_id"]
            plan = sub.get("plan", "free")
            credits = PLAN_CREDITS.get(plan, 50)

            # Check if already exists
            from sqlalchemy import select
            result = await db.execute(
                select(CreditBalance).where(
                    CreditBalance.workspace_id == _as_uuid(workspace_id)
                )
            )
            existing = result.scalar_one_or_none()

            if existing:
                logger.info("  Skip workspace %s (already has balance)", workspace_id)
                skipped += 1
                continue

            # Create balance
            balance = CreditBalance(
                workspace_id=_as_uuid(workspace_id),
                subscription_credits=credits,
                purchased_credits=0,
            )
            db.add(balance)
            await db.flush()

            # Create initial transaction
            tx = CreditTransaction(
                workspace_id=_as_uuid(workspace_id),
                user_id=_as_uuid("00000000-0000-0000-0000-000000000000"),  # system
                type="grant_subscription",
                amount=credits,
                balance_after=credits,
                tx_metadata={"plan": plan, "seed": True},
            )
            db.add(tx)

            logger.info("  Seeded workspace %s: plan=%s, credits=%d", workspace_id, plan, credits)
            created += 1

        await db.commit()
        logger.info("Done! Created: %d, Skipped: %d", created, skipped)


if __name__ == "__main__":
    asyncio.run(seed())
