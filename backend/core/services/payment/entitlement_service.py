from uuid import UUID
from sqlalchemy.orm import Session

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