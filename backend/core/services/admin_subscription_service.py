"""Admin subscription management.

Backs the dashboard's Business → Subscriptions section. An admin can:
  - list active subscribers (paginated)
  - search profiles (to find who to grant to)
  - grant a manual comp subscription
  - revoke a manual comp subscription

A "grant" is a billing_subscriptions row with provider="manual" / status="active".
entitlement_service.is_subscribed() already returns true for it, so there are no
changes to entitlement logic. A "revoke" soft-ends the row (status=canceled,
ended_at=now) so is_subscribed() flips to false while history is preserved.

Manual grants deliberately do NOT touch Stripe/RevenueCat. Revoke is scoped to
manual rows only — ending a provider-synced row here would just get recreated by
the next webhook.
"""

from uuid import UUID

from sqlalchemy.orm import Session

from core.infrastructure.db.repositories import profiles as profiles_repo
from core.infrastructure.db.repositories import billing_customer as billing_customer_repo
from core.infrastructure.db.repositories import billing_subscription as billing_subscription_repo
from core.infrastructure.db.repositories.billing_subscription import MANUAL_PROVIDER
from core.services import exceptions
from core.services.dtos.subscription import PageDTO, ProfileMatchDTO, SubscriberDTO


def list_subscribers(
    db_session: Session,
    *,
    limit: int,
    offset: int,
) -> PageDTO[SubscriberDTO]:
    rows = billing_subscription_repo.list_valid_subscriptions_with_profiles(
        db_session, limit=limit, offset=offset
    )
    total = billing_subscription_repo.count_valid_subscriptions(db_session)
    items = [
        SubscriberDTO(
            user_id=profile.id,
            name=profile.name,
            email=profile.email,
            subscription_id=subscription.id,
            provider=subscription.provider,
            status=subscription.status,
            current_period_end=subscription.current_period_end,
        )
        for subscription, profile in rows
    ]
    return PageDTO(items=items, total=total, limit=limit, offset=offset)


def search_profiles(
    db_session: Session,
    query: str,
    *,
    limit: int,
) -> list[ProfileMatchDTO]:
    query = query.strip()
    if not query:
        return []

    matches = profiles_repo.search_profiles(db_session, query, limit=limit)
    results: list[ProfileMatchDTO] = []
    for profile in matches:
        # Use the SAME "currently valid" predicate as the grant-guard so the
        # dashboard's `subscribed` flag (which disables the Grant button) matches
        # exactly what the grant endpoint will do. A lapsed / past_due / period-
        # passed / not-yet-started row shows as NOT subscribed → grantable.
        valid = billing_subscription_repo.get_valid_subscription_for_user(
            profile.id, db_session
        )
        results.append(
            ProfileMatchDTO(
                user_id=profile.id,
                name=profile.name,
                email=profile.email,
                subscribed=valid is not None,
                provider=valid.provider if valid else None,
                subscription_id=valid.id if valid else None,
            )
        )
    return results


def grant_manual_subscription(user_id: UUID, db_session: Session) -> SubscriberDTO:
    profile = profiles_repo.get_profile_by_id(user_id, db_session)
    if not profile:
        raise exceptions.NotFoundException("User", str(user_id))

    # Block only a genuinely-current subscription. A lapsed / past_due / webhook-
    # stuck row (period passed) must NOT block a comp — that's exactly when an
    # admin wants to grant one. See get_valid_subscription_for_user.
    if billing_subscription_repo.get_valid_subscription_for_user(user_id, db_session):
        raise exceptions.ConflictException(
            "User already has an active subscription"
        )

    customer = billing_customer_repo.get_customer_by_user_and_provider(
        user_id, MANUAL_PROVIDER, db_session
    )
    if customer is None:
        customer = billing_customer_repo.create_billing_customer(
            user_id=user_id,
            customer_id=f"manual_{user_id}",
            provider=MANUAL_PROVIDER,
            session=db_session,
        )

    subscription = billing_subscription_repo.create_manual_subscription(
        billing_customer_id=customer.id,
        session=db_session,
    )
    return SubscriberDTO(
        user_id=profile.id,
        name=profile.name,
        email=profile.email,
        subscription_id=subscription.id,
        provider=subscription.provider,
        status=subscription.status,
        current_period_end=subscription.current_period_end,
    )


def revoke_manual_subscription(subscription_id: UUID, db_session: Session) -> None:
    subscription = billing_subscription_repo.get_subscription_by_id(
        subscription_id, db_session
    )
    if subscription is None:
        raise exceptions.NotFoundException("Subscription", str(subscription_id))

    if subscription.provider != MANUAL_PROVIDER:
        raise exceptions.ConflictException(
            "Only manual subscriptions can be revoked from the admin panel. "
            "Stripe and RevenueCat subscriptions are managed by the provider."
        )

    billing_subscription_repo.end_subscription(subscription, db_session)
