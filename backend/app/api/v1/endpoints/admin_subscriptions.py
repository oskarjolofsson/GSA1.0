from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies.db import get_db
from app.dependencies.require_admin import require_admin
from app.api.v1.schemas.subscription import (
    GrantSubscriptionRequest,
    ProfileMatchResponse,
    SubscriberPageResponse,
    SubscriberResponse,
)
from core.services import admin_subscription_service

router = APIRouter()


@router.get("/", response_model=SubscriberPageResponse)
def list_subscribers(
    limit: int = Query(default=10, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Paginated list of active subscribers. Requires admin privileges."""
    page = admin_subscription_service.list_subscribers(db, limit=limit, offset=offset)
    return SubscriberPageResponse.from_domain(page)


@router.get("/search/", response_model=list[ProfileMatchResponse])
def search_profiles(
    q: str = Query(default=""),
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Search profiles by name/email to find who to grant a subscription to."""
    matches = admin_subscription_service.search_profiles(db, q, limit=limit)
    return [ProfileMatchResponse.from_domain(match) for match in matches]


@router.post("/", response_model=SubscriberResponse, status_code=201)
def grant_subscription(
    body: GrantSubscriptionRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Grant a manual comp subscription to a user."""
    subscriber = admin_subscription_service.grant_manual_subscription(body.user_id, db)
    return SubscriberResponse.from_domain(subscriber)


@router.delete("/{subscription_id}/", status_code=204)
def revoke_subscription(
    subscription_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Soft-end a manual subscription. Provider-synced subscriptions cannot be revoked here."""
    admin_subscription_service.revoke_manual_subscription(subscription_id, db)
