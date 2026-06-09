from uuid import UUID

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from core.services.payment import entitlement_service


def require_premium(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    user_id = UUID(current_user["user_id"])
    if not entitlement_service.can_access_premium_features(user_id, db):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Subscription required",
        )
    return current_user
