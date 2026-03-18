"""
Billing endpoints for Stripe integration.

Handles:
- Subscription checkout (5 plans: Free/Solo/Agency/Enterprise + Custom)
- Credit package purchases (one-time payments)
- Webhooks (subscription lifecycle + credit grants)
- Customer portal
- Plan listing for pricing page
"""

import stripe
import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from app.config import settings
from app.auth_supabase import get_current_user, verify_workspace_access
from app.lib.supabase import supabase, get_workspace_subscription
from app.services.credit_service import (
    reset_subscription_credits,
    grant_credits,
    PLAN_CREDITS,
    CREDIT_PACKAGES,
)
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/billing", tags=["Billing"])

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


# ---------------------------------------------------------------------------
# Price → Plan mapping (built at startup from env vars)
# ---------------------------------------------------------------------------

def _build_price_to_plan() -> Dict[str, tuple]:
    """Build mapping from Stripe price IDs to (plan_name, credits_per_cycle)."""
    mapping = {}
    pairs = [
        (settings.STRIPE_PRICE_ID_SOLO_MONTHLY, "solo", 100),
        (settings.STRIPE_PRICE_ID_SOLO_ANNUAL, "solo", 100),
        (settings.STRIPE_PRICE_ID_AGENCY_MONTHLY, "agency", 400),
        (settings.STRIPE_PRICE_ID_AGENCY_ANNUAL, "agency", 400),
        (settings.STRIPE_PRICE_ID_ENTERPRISE_MONTHLY, "enterprise", 2000),
        (settings.STRIPE_PRICE_ID_ENTERPRISE_ANNUAL, "enterprise", 2000),
        # Legacy backward compat
        (settings.STRIPE_PRICE_ID_PRO, "solo", 100),
        (settings.STRIPE_PRICE_ID_ENTERPRISE, "enterprise", 2000),
    ]
    for price_id, plan, credits in pairs:
        if price_id:
            mapping[price_id] = (plan, credits)
    return mapping


def _build_credit_package_prices() -> Dict[str, str]:
    """Build mapping from package_id to Stripe price ID."""
    mapping = {}
    pairs = [
        ("starter", settings.STRIPE_PRICE_ID_CREDITS_STARTER),
        ("standard", settings.STRIPE_PRICE_ID_CREDITS_STANDARD),
        ("pro", settings.STRIPE_PRICE_ID_CREDITS_PRO),
        ("agency", settings.STRIPE_PRICE_ID_CREDITS_AGENCY),
    ]
    for pkg_id, price_id in pairs:
        if price_id:
            mapping[pkg_id] = price_id
    return mapping


PRICE_TO_PLAN = _build_price_to_plan()
CREDIT_PACKAGE_PRICES = _build_credit_package_prices()


# ---------------------------------------------------------------------------
# Request/Response schemas
# ---------------------------------------------------------------------------

class CheckoutSessionRequest(BaseModel):
    workspace_id: str
    price_id: str = ""  # raw Stripe price ID (legacy)
    plan_id: str = ""   # e.g. "solo", "agency", "enterprise"
    billing_period: str = "monthly"  # "monthly" or "annual"


class PurchaseCreditsRequest(BaseModel):
    workspace_id: str
    package_id: str


class PlanInfo(BaseModel):
    id: str
    name: str
    price_monthly: int  # cents
    price_annual: int  # cents (per month)
    credits_per_cycle: int
    features: List[str]
    highlighted: bool = False


# ---------------------------------------------------------------------------
# Plan list (for pricing page)
# ---------------------------------------------------------------------------

PLANS: List[Dict[str, Any]] = [
    {
        "id": "free",
        "name": "Free",
        "price_monthly": 0,
        "price_annual": 0,
        "credits_per_cycle": 50,
        "credits_note": "jednorazowo",
        "highlighted": False,
        "features": [
            "50 kredytów na start",
            "1 audyt demo (raport 80% zblurowany)",
            "AI Chat (do wyczerpania kredytów)",
            "Workspace osobisty",
        ],
    },
    {
        "id": "solo",
        "name": "Solo",
        "price_monthly": 999,
        "price_annual": 799,
        "credits_per_cycle": 100,
        "credits_note": "miesięcznie",
        "highlighted": False,
        "stripe_price_monthly": settings.STRIPE_PRICE_ID_SOLO_MONTHLY,
        "stripe_price_annual": settings.STRIPE_PRICE_ID_SOLO_ANNUAL,
        "features": [
            "100 kredytów/msc (~3 audyty)",
            "Pełne raporty (bez blurowania)",
            "1 harmonogram automatyczny",
            "Dokupywanie kredytów",
            "Do 3 członków workspace",
            "Wsparcie email",
        ],
    },
    {
        "id": "agency",
        "name": "Agency",
        "price_monthly": 2999,
        "price_annual": 2399,
        "credits_per_cycle": 400,
        "credits_note": "miesięcznie",
        "highlighted": True,
        "stripe_price_monthly": settings.STRIPE_PRICE_ID_AGENCY_MONTHLY,
        "stripe_price_annual": settings.STRIPE_PRICE_ID_AGENCY_ANNUAL,
        "features": [
            "400 kredytów/msc (~13 audytów)",
            "Branding raportów PDF (logo klienta)",
            "5 harmonogramów automatycznych",
            "Analiza do 3 konkurentów",
            "Wiele workspace'ów",
            "Do 10 członków workspace",
            "Wsparcie priorytetowe",
        ],
    },
    {
        "id": "enterprise",
        "name": "Enterprise",
        "price_monthly": 9900,
        "price_annual": 7900,
        "credits_per_cycle": 2000,
        "credits_note": "miesięcznie",
        "highlighted": False,
        "stripe_price_monthly": settings.STRIPE_PRICE_ID_ENTERPRISE_MONTHLY,
        "stripe_price_annual": settings.STRIPE_PRICE_ID_ENTERPRISE_ANNUAL,
        "features": [
            "2 000 kredytów/msc (~66 audytów)",
            "White-label PDF (pełne brandowanie)",
            "Unlimited harmonogramy",
            "Unlimited członków workspace",
            "Dedykowane wsparcie + SLA",
        ],
    },
]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/plans")
async def list_plans():
    """Return pricing plans for the pricing page."""
    # Strip Stripe price IDs from public response
    public_plans = []
    for plan in PLANS:
        p = {k: v for k, v in plan.items() if not k.startswith("stripe_")}
        public_plans.append(p)
    return public_plans


@router.post("/create-checkout-session")
async def create_checkout_session(
    data: CheckoutSessionRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create Stripe checkout session for workspace subscription."""
    has_access = await verify_workspace_access(
        current_user["id"], data.workspace_id, required_role="owner"
    )
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only workspace owners can upgrade subscription"
        )

    # Resolve price_id: either from raw price_id or from plan_id + billing_period
    effective_price_id = data.price_id

    if not effective_price_id and data.plan_id:
        # Lookup Stripe price ID from plan_id + period
        plan_price_map = {
            ("solo", "monthly"): settings.STRIPE_PRICE_ID_SOLO_MONTHLY,
            ("solo", "annual"): settings.STRIPE_PRICE_ID_SOLO_ANNUAL,
            ("agency", "monthly"): settings.STRIPE_PRICE_ID_AGENCY_MONTHLY,
            ("agency", "annual"): settings.STRIPE_PRICE_ID_AGENCY_ANNUAL,
            ("enterprise", "monthly"): settings.STRIPE_PRICE_ID_ENTERPRISE_MONTHLY,
            ("enterprise", "annual"): settings.STRIPE_PRICE_ID_ENTERPRISE_ANNUAL,
        }
        effective_price_id = plan_price_map.get((data.plan_id, data.billing_period), "")
        if not effective_price_id:
            raise HTTPException(status_code=400, detail=f"Plan '{data.plan_id}' ({data.billing_period}) not configured in Stripe yet")

    plan_info = PRICE_TO_PLAN.get(effective_price_id)
    if not plan_info:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid price ID or plan not configured"
        )
    plan_name, plan_credits = plan_info

    try:
        subscription = await get_workspace_subscription(data.workspace_id)
        if not subscription:
            raise HTTPException(status_code=404, detail="Subscription not found")

        # Get or create Stripe customer
        if subscription["stripe_customer_id"]:
            customer_id = subscription["stripe_customer_id"]
        else:
            customer = stripe.Customer.create(
                email=current_user["email"],
                metadata={"workspace_id": data.workspace_id}
            )
            customer_id = customer.id
            supabase.table("subscriptions").update({
                "stripe_customer_id": customer_id
            }).eq("workspace_id", data.workspace_id).execute()

        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[{"price": effective_price_id, "quantity": 1}],
            mode="subscription",
            success_url=f"{settings.FRONTEND_URL}/settings/billing?success=true&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.FRONTEND_URL}/pricing?canceled=true",
            metadata={
                "workspace_id": data.workspace_id,
                "plan": plan_name,
                "credits_per_cycle": str(plan_credits),
            },
        )

        logger.info(f"Created checkout session for workspace {data.workspace_id} (plan={plan_name})")
        return {"checkout_url": session.url}

    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        logger.error(f"Checkout session error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")


@router.post("/purchase-credits")
async def purchase_credits(
    data: PurchaseCreditsRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create Stripe checkout for one-time credit package purchase."""
    has_access = await verify_workspace_access(current_user["id"], data.workspace_id)
    if not has_access:
        raise HTTPException(status_code=403, detail="Access denied")

    # Check plan allows purchasing
    subscription = await get_workspace_subscription(data.workspace_id)
    plan = subscription["plan"] if subscription else "free"
    if plan == "free":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Plan Free nie pozwala na dokupywanie kredytów. Ulepsz do planu Solo."
        )

    # Validate package
    package = CREDIT_PACKAGES.get(data.package_id)
    if not package:
        raise HTTPException(status_code=400, detail="Invalid package ID")

    stripe_price_id = CREDIT_PACKAGE_PRICES.get(data.package_id)
    if not stripe_price_id:
        raise HTTPException(status_code=400, detail="Credit package not configured in Stripe")

    try:
        # Get or create Stripe customer
        customer_id = subscription.get("stripe_customer_id")
        if not customer_id:
            customer = stripe.Customer.create(
                email=current_user["email"],
                metadata={"workspace_id": data.workspace_id}
            )
            customer_id = customer.id
            supabase.table("subscriptions").update({
                "stripe_customer_id": customer_id
            }).eq("workspace_id", data.workspace_id).execute()

        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[{"price": stripe_price_id, "quantity": 1}],
            mode="payment",  # one-time, not subscription
            success_url=f"{settings.FRONTEND_URL}/settings/billing?success=true&credits=true",
            cancel_url=f"{settings.FRONTEND_URL}/settings/billing?canceled=true",
            metadata={
                "workspace_id": data.workspace_id,
                "type": "credit_package",
                "package_id": data.package_id,
                "credits_amount": str(package["credits"]),
            },
        )

        logger.info(f"Created credit purchase session for workspace {data.workspace_id} (package={data.package_id})")
        return {"checkout_url": session.url}

    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")


# ---------------------------------------------------------------------------
# Webhook
# ---------------------------------------------------------------------------

@router.post("/webhook")
async def stripe_webhook(request: Request):
    """
    Handle Stripe webhooks for subscription events and credit purchases.

    Configure in Stripe dashboard:
    - URL: https://sitespector.app/api/billing/webhook
    - Events: checkout.session.completed, customer.subscription.deleted,
              customer.subscription.updated, invoice.paid
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    event_type = event["type"]
    data = event["data"]["object"]
    logger.info(f"Stripe webhook: {event_type}")

    if event_type == "checkout.session.completed":
        session = data
        workspace_id = session["metadata"].get("workspace_id")
        session_mode = session.get("mode")

        if session_mode == "payment" and session["metadata"].get("type") == "credit_package":
            # --- Credit package purchase ---
            package_id = session["metadata"].get("package_id", "")
            credits_amount = int(session["metadata"].get("credits_amount", "0"))

            if credits_amount > 0 and workspace_id:
                try:
                    from app.database import AsyncSessionLocal
                    async with AsyncSessionLocal() as db:
                        await grant_credits(
                            db, workspace_id, "00000000-0000-0000-0000-000000000000",
                            credits_amount, "grant_purchase",
                            {"package_id": package_id, "stripe_session_id": session.get("id")},
                            target="purchased",
                        )
                        await db.commit()
                        logger.info(f"Granted {credits_amount} purchased credits to workspace {workspace_id}")
                except Exception as e:
                    logger.error(f"Failed to grant purchased credits: {e}")

        else:
            # --- Subscription checkout ---
            plan = session["metadata"].get("plan", "solo")
            subscription_id = session.get("subscription")
            plan_credits = int(session["metadata"].get("credits_per_cycle", PLAN_CREDITS.get(plan, 0)))

            # Legacy audit_limits for backward compat
            audit_limits = {"solo": 100, "agency": 400, "enterprise": 999999, "pro": 50}

            supabase.table("subscriptions").update({
                "stripe_subscription_id": subscription_id,
                "plan": plan,
                "status": "active",
                "audit_limit": audit_limits.get(plan, 5),
                "current_period_start": session.get("current_period_start"),
                "current_period_end": session.get("current_period_end"),
            }).eq("workspace_id", workspace_id).execute()

            logger.info(f"Activated {plan} plan for workspace {workspace_id}")

            # Grant subscription credits
            try:
                from app.database import AsyncSessionLocal
                async with AsyncSessionLocal() as db:
                    if plan_credits > 0:
                        await reset_subscription_credits(db, workspace_id, plan_credits)
                        await db.commit()
                        logger.info(f"Granted {plan_credits} credits to workspace {workspace_id}")
            except Exception as e:
                logger.error(f"Failed to grant credits for workspace {workspace_id}: {e}")

    elif event_type == "customer.subscription.updated":
        subscription_obj = data
        customer_id = subscription_obj["customer"]

        subscription_data = supabase.table("subscriptions").select("*").eq(
            "stripe_customer_id", customer_id
        ).execute()

        if subscription_data.data:
            workspace_id = subscription_data.data[0]["workspace_id"]
            supabase.table("subscriptions").update({
                "status": subscription_obj["status"],
                "current_period_start": subscription_obj["current_period_start"],
                "current_period_end": subscription_obj["current_period_end"],
                "cancel_at": subscription_obj.get("cancel_at"),
            }).eq("workspace_id", workspace_id).execute()
            logger.info(f"Updated subscription for workspace {workspace_id}")

    elif event_type == "customer.subscription.deleted":
        subscription_obj = data
        customer_id = subscription_obj["customer"]

        subscription_data = supabase.table("subscriptions").select("*").eq(
            "stripe_customer_id", customer_id
        ).execute()

        if subscription_data.data:
            workspace_id = subscription_data.data[0]["workspace_id"]
            supabase.table("subscriptions").update({
                "plan": "free",
                "status": "canceled",
                "audit_limit": 5,
                "stripe_subscription_id": None,
            }).eq("workspace_id", workspace_id).execute()
            logger.info(f"Downgraded workspace {workspace_id} to free plan")

            try:
                from app.database import AsyncSessionLocal
                async with AsyncSessionLocal() as credit_db:
                    await reset_subscription_credits(credit_db, workspace_id, 0)
                    await credit_db.commit()
            except Exception as e:
                logger.error(f"Failed to zero credits for workspace {workspace_id}: {e}")

    elif event_type == "invoice.paid":
        invoice = data
        customer_id = invoice["customer"]

        subscription_data = supabase.table("subscriptions").select("*").eq(
            "stripe_customer_id", customer_id
        ).execute()

        if subscription_data.data:
            workspace_id = subscription_data.data[0]["workspace_id"]

            supabase.table("invoices").insert({
                "workspace_id": workspace_id,
                "stripe_invoice_id": invoice["id"],
                "amount_paid": invoice["amount_paid"],
                "currency": invoice["currency"],
                "status": invoice["status"],
                "invoice_pdf": invoice.get("invoice_pdf"),
            }).execute()
            logger.info(f"Recorded invoice for workspace {workspace_id}")

            # Renew subscription credits
            try:
                plan = subscription_data.data[0].get("plan", "free")
                from app.database import AsyncSessionLocal
                async with AsyncSessionLocal() as credit_db:
                    plan_credits = PLAN_CREDITS.get(plan, 0)
                    if plan_credits > 0:
                        await reset_subscription_credits(credit_db, workspace_id, plan_credits)
                        await credit_db.commit()
                        logger.info(f"Renewed {plan_credits} credits for workspace {workspace_id}")
            except Exception as e:
                logger.error(f"Failed to renew credits: {e}")

    return {"status": "success"}


# ---------------------------------------------------------------------------
# Customer Portal
# ---------------------------------------------------------------------------

@router.post("/create-portal-session")
async def create_portal_session(
    workspace_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Create Stripe Customer Portal session for managing subscription."""
    has_access = await verify_workspace_access(
        current_user["id"], workspace_id, required_role="owner"
    )
    if not has_access:
        raise HTTPException(status_code=403, detail="Only workspace owners can manage billing")

    try:
        subscription = await get_workspace_subscription(workspace_id)
        if not subscription or not subscription.get("stripe_customer_id"):
            raise HTTPException(status_code=404, detail="No Stripe customer found")

        session = stripe.billing_portal.Session.create(
            customer=subscription["stripe_customer_id"],
            return_url=f"{settings.FRONTEND_URL}/settings/billing",
        )
        return {"portal_url": session.url}

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
