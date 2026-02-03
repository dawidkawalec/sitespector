"""
Billing endpoints for Stripe integration.

Handles:
- Creating checkout sessions
- Processing webhooks
- Managing subscriptions
"""

import stripe
import logging
from fastapi import APIRouter, Depends, HTTPException, Request, status
from app.config import settings
from app.auth_supabase import get_current_user, verify_workspace_access
from app.lib.supabase import supabase, get_workspace_subscription
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/billing", tags=["Billing"])

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


class CheckoutSessionRequest(BaseModel):
    workspace_id: str
    price_id: str


@router.post("/create-checkout-session")
async def create_checkout_session(
    data: CheckoutSessionRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Create Stripe checkout session for workspace subscription.
    
    Only workspace owners can upgrade subscription.
    """
    # Verify user is owner or admin
    has_access = await verify_workspace_access(
        current_user["id"], 
        data.workspace_id, 
        required_role="owner"
    )
    
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only workspace owners can upgrade subscription"
        )
    
    try:
        # Get or create Stripe customer
        subscription = await get_workspace_subscription(data.workspace_id)
        
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription not found"
            )
        
        if subscription["stripe_customer_id"]:
            customer_id = subscription["stripe_customer_id"]
        else:
            # Create Stripe customer
            customer = stripe.Customer.create(
                email=current_user["email"],
                metadata={"workspace_id": data.workspace_id}
            )
            customer_id = customer.id
            
            # Save customer ID
            supabase.table("subscriptions").update({
                "stripe_customer_id": customer_id
            }).eq("workspace_id", data.workspace_id).execute()
        
        # Determine plan from price_id
        plan_name = "pro" if "pro" in data.price_id.lower() else "enterprise"
        
        # Create checkout session
        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[{
                "price": data.price_id,
                "quantity": 1
            }],
            mode="subscription",
            success_url=f"{settings.FRONTEND_URL}/settings/billing?success=true&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.FRONTEND_URL}/pricing?canceled=true",
            metadata={
                "workspace_id": data.workspace_id,
                "plan": plan_name
            }
        )
        
        logger.info(f"Created checkout session for workspace {data.workspace_id}")
        
        return {"checkout_url": session.url}
    
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stripe error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Checkout session error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create checkout session: {str(e)}"
        )


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """
    Handle Stripe webhooks for subscription events.
    
    Important: Configure webhook endpoint in Stripe dashboard:
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
    except ValueError as e:
        logger.error(f"Invalid payload: {e}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle different event types
    event_type = event["type"]
    data = event["data"]["object"]
    
    logger.info(f"Received Stripe webhook: {event_type}")
    
    if event_type == "checkout.session.completed":
        # Payment successful, activate subscription
        session = data
        workspace_id = session["metadata"]["workspace_id"]
        plan = session["metadata"]["plan"]
        subscription_id = session["subscription"]
        
        # Determine audit limit based on plan
        audit_limits = {
            "pro": 50,
            "enterprise": 999999  # Effectively unlimited
        }
        
        supabase.table("subscriptions").update({
            "stripe_subscription_id": subscription_id,
            "plan": plan,
            "status": "active",
            "audit_limit": audit_limits.get(plan, 5),
            "current_period_start": session.get("current_period_start"),
            "current_period_end": session.get("current_period_end")
        }).eq("workspace_id", workspace_id).execute()
        
        logger.info(f"Activated {plan} plan for workspace {workspace_id}")
    
    elif event_type == "customer.subscription.updated":
        # Subscription updated (renewal, plan change)
        subscription_obj = data
        customer_id = subscription_obj["customer"]
        
        # Find workspace by customer ID
        subscription_data = supabase.table("subscriptions").select("*").eq(
            "stripe_customer_id", customer_id
        ).execute()
        
        if subscription_data.data:
            workspace_id = subscription_data.data[0]["workspace_id"]
            
            supabase.table("subscriptions").update({
                "status": subscription_obj["status"],
                "current_period_start": subscription_obj["current_period_start"],
                "current_period_end": subscription_obj["current_period_end"],
                "cancel_at": subscription_obj.get("cancel_at")
            }).eq("workspace_id", workspace_id).execute()
            
            logger.info(f"Updated subscription for workspace {workspace_id}")
    
    elif event_type == "customer.subscription.deleted":
        # Subscription canceled, downgrade to free
        subscription_obj = data
        customer_id = subscription_obj["customer"]
        
        # Find workspace by customer ID
        subscription_data = supabase.table("subscriptions").select("*").eq(
            "stripe_customer_id", customer_id
        ).execute()
        
        if subscription_data.data:
            workspace_id = subscription_data.data[0]["workspace_id"]
            
            supabase.table("subscriptions").update({
                "plan": "free",
                "status": "canceled",
                "audit_limit": 5,
                "stripe_subscription_id": None
            }).eq("workspace_id", workspace_id).execute()
            
            logger.info(f"Downgraded workspace {workspace_id} to free plan")
    
    elif event_type == "invoice.paid":
        # Invoice paid, record in invoices table
        invoice = data
        customer_id = invoice["customer"]
        
        # Find workspace by customer ID
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
                "invoice_pdf": invoice.get("invoice_pdf")
            }).execute()
            
            logger.info(f"Recorded invoice for workspace {workspace_id}")
    
    return {"status": "success"}


@router.post("/create-portal-session")
async def create_portal_session(
    workspace_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Create Stripe Customer Portal session for managing subscription.
    
    Allows users to:
    - Update payment method
    - Cancel subscription
    - View invoices
    """
    # Verify user is owner or admin
    has_access = await verify_workspace_access(
        current_user["id"], 
        workspace_id, 
        required_role="owner"
    )
    
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only workspace owners can manage billing"
        )
    
    try:
        subscription = await get_workspace_subscription(workspace_id)
        
        if not subscription or not subscription.get("stripe_customer_id"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No Stripe customer found"
            )
        
        session = stripe.billing_portal.Session.create(
            customer=subscription["stripe_customer_id"],
            return_url=f"{settings.FRONTEND_URL}/settings/billing"
        )
        
        return {"portal_url": session.url}
    
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stripe error: {str(e)}"
        )
