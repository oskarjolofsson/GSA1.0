from uuid import UUID
from sqlalchemy.orm import Session
from datetime import timedelta, datetime, timezone

from core.infrastructure.db import models
from core.infrastructure.db.repositories import profiles
from core.infrastructure.db.repositories import billing_customer as billing_customer_repo
from core.infrastructure.db.repositories import billing_subscription as billing_subscription_repo
from core.services import exceptions

def is_subscribed(user_id: UUID, db_session: Session) -> bool:
    # Get profile by user_id
    profile: models.Profile = profiles.get_profile_by_id(user_id, db_session)
    if not profile:
        raise exceptions.NotFoundException("User", str(user_id))
    
    
    # Get active subscription by billing user_id
    billing_subscription = billing_subscription_repo.get_active_subscriptions_for_user(user_id, db_session)
    # Return true if active subscription exists, false otherwise
    if billing_subscription: return True
    return False


def has_free_tier(user_id: UUID, db_session: Session) -> bool:
    # Get profile by user_id
    profile: models.Profile = profiles.get_profile_by_id(user_id, db_session)
    if not profile:
        raise exceptions.NotFoundException("User", str(user_id))
    
    # If the profile has was created withing the last 7 days, they are eligible for the free tier
    return profile.created_at >= datetime.now(timezone.utc) - timedelta(days=7)
    
    
def can_access_premium_features(user_id: UUID, db_session: Session) -> bool:
    # A user can access premium features if they are either subscribed or have free tier access
    return is_subscribed(user_id, db_session) or has_free_tier(user_id, db_session)


def free_tier_expires_at(user_id: UUID, db_session: Session) -> datetime:
    profile: models.Profile = profiles.get_profile_by_id(user_id, db_session)
    if not profile:
        raise exceptions.NotFoundException("User", str(user_id))
    return profile.created_at + timedelta(days=7)


def get_subscription_summary(user_id: UUID, db_session: Session) -> dict | None:
    # Period/cancel info for the UI's subscription card. None when the user has
    # no active subscription (free tier or never subscribed).
    subscription = billing_subscription_repo.get_active_subscriptions_for_user(user_id, db_session)
    if subscription is None:
        return None

    return {
        "status": subscription.status,
        "current_period_end": (
            subscription.current_period_end.isoformat()
            if subscription.current_period_end
            else None
        ),
        "cancel_at_period_end": subscription.cancel_at_period_end,
        # canceled_at is the reliable "will not renew" signal: null only when the
        # subscription is genuinely renewing; set in both cancel modes (at-period-end
        # and immediate), and cleared back to null if the user reactivates.
        "canceled_at": (
            subscription.canceled_at.isoformat() if subscription.canceled_at else None
        ),
        "ended_at": (
            subscription.ended_at.isoformat() if subscription.ended_at else None
        ),
    }