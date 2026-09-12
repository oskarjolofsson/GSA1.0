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

    There is no free tier: `is_subscribed` is the single flag to gate premium/AI
    features on. `subscription` is None when the user has never subscribed.
    """
    user_id = UUID(current_user["user_id"])
    return {
        "is_subscribed": entitlement_service.is_subscribed(user_id, db),
        "subscription": entitlement_service.get_subscription_summary(user_id, db),
    }
