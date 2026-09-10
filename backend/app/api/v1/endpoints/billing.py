from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from core.services.payment import entitlement_service
from uuid import UUID


router = APIRouter()


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
