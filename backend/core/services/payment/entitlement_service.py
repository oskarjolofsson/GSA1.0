from uuid import UUID
from sqlalchemy.orm import Session

from core.infrastructure.db.repositories import profiles
from core.infrastructure.db.repositories import billing_customer as billing_customer_repo
from core.infrastructure.db.repositories import billing_subscription as billing_subscription_repo
from core.services import exceptions

def is_subscribed(user_id: UUID, db_session: Session) -> bool:
    """True when the user has a paid subscription with any provider."""
    profile = profiles.get_profile_by_id(user_id, db_session)
    if not profile:
        raise exceptions.NotFoundException("User", str(user_id))

    billing_subscription = billing_subscription_repo.get_active_subscriptions_for_user(user_id, db_session)
    if billing_subscription: return True
    return False


def get_subscription_summary(user_id: UUID, db_session: Session) -> dict | None:
    """
    Period and cancellation info for the UI's subscription card.

    None when the user has no active subscription — free tier or never subscribed.
    """
    subscription = billing_subscription_repo.get_active_subscriptions_for_user(user_id, db_session)
    if subscription is None:
        return None

    return {
        # provider tells the client how this subscription is managed: "revenuecat"
        # (bought in-app, managed in the App Store / Play Store) or "manual" (a comp
        # granted by an admin, which the user cannot manage anywhere). See ADR-0005.
        "provider": subscription.provider,
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