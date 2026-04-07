from uuid import UUID
from sqlalchemy.orm import Session
from datetime import timedelta, datetime

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
    if profile.created_at >= datetime.utcnow() - timedelta(days=7):
        return True
    
    
def can_access_premium_features(user_id: UUID, db_session: Session) -> bool:
    # A user can access premium features if they are either subscribed or have free tier access
    return is_subscribed(user_id, db_session) or has_free_tier(user_id, db_session)