from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from core.services.payment import billing_service, entitlement_service
from uuid import UUID


router = APIRouter()


@router.post("/checkout-session/")
async def checkout_session(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Open a Stripe Checkout session for a web subscription.

    Refuses with 409 if the user already has an active subscription with **any**
    provider, including a mobile one bought through RevenueCat. Mobile purchases
    happen on the store and cannot be intercepted here, but they land in
    `billing_subscriptions` via the RevenueCat webhook, so this is where the
    double-subscription is caught.
    """
    checkout_url = await billing_service.start_subscription_checkout(
        user_id=UUID(current_user["user_id"]),
        db_session=db,
    )
    return {"checkout_url": checkout_url}
    
    
@router.get("/portal/")
async def portal(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Open the Stripe customer portal, where a web subscriber manages their plan.

    Stripe-only: a RevenueCat (mobile) subscription is managed in the App Store or
    Play Store and the portal cannot touch it. Check `provider` on the status
    endpoint before sending a user here.
    """
    portal_url = await billing_service.create_customer_portal(
        user_id=UUID(current_user["user_id"]),
        db_session=db,
    )
    return {"portal_url": portal_url}
    
    
@router.get("/status")
def status(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Everything the client needs to decide what a user may access and what to render.

    `can_access_premium` is the flag to gate features on — it is true for both paying
    subscribers and users still inside the 7-day free tier, so callers should not try
    to recombine `is_subscribed` and `has_free_tier` themselves. `subscription` is
    None when the user has never subscribed.
    """
    user_id = UUID(current_user["user_id"])
    return {
        "is_subscribed": entitlement_service.is_subscribed(user_id, db),
        "has_free_tier": entitlement_service.has_free_tier(user_id, db),
        "can_access_premium": entitlement_service.can_access_premium_features(user_id, db),
        "free_tier_expires_at": entitlement_service.free_tier_expires_at(user_id, db).isoformat(),
        "subscription": entitlement_service.get_subscription_summary(user_id, db),
    }