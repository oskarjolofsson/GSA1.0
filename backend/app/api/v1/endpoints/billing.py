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
    user_id = UUID(current_user["user_id"])
    return {
        "is_subscribed": entitlement_service.is_subscribed(user_id, db),
        "has_free_tier": entitlement_service.has_free_tier(user_id, db),
        "can_access_premium": entitlement_service.can_access_premium_features(user_id, db),
        "free_tier_expires_at": entitlement_service.free_tier_expires_at(user_id, db).isoformat(),
    }