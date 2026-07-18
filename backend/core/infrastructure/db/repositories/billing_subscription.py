
import uuid
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from core.infrastructure.db import models

ACTIVE_SUBSCRIPTION_STATUSES = ("trialing", "active", "past_due", "unpaid")

# Manual comp grants created by an admin. Not backed by Stripe/RevenueCat, so
# there is nothing to charge and no external system to keep in sync.
MANUAL_PROVIDER = "manual"
MANUAL_PRICE_ID = "manual_comp"


def get_subscription_by_external_id(
    provider: str,
    external_subscription_id: str,
    session: Session,
) -> models.BillingSubscription | None:
    stmt = select(models.BillingSubscription).where(
        models.BillingSubscription.provider == provider,
        models.BillingSubscription.external_subscription_id == external_subscription_id,
    )
    return session.scalar(stmt)


def get_active_subscriptions(
    billing_customer_id: UUID,
    session: Session,
) -> models.BillingSubscription | None:
    stmt = (
        select(models.BillingSubscription)
        .where(models.BillingSubscription.billing_customer_id == billing_customer_id)
        .where(models.BillingSubscription.status.in_(ACTIVE_SUBSCRIPTION_STATUSES))
        .order_by(models.BillingSubscription.created_at.desc())
    )
    return session.scalars(stmt).first()


def get_active_subscriptions_for_user(
    user_id: UUID,
    session: Session,
) -> models.BillingSubscription | None:
    stmt = (
        select(models.BillingSubscription)
        .join(models.BillingCustomer, models.BillingSubscription.billing_customer_id == models.BillingCustomer.id)
        .where(models.BillingCustomer.user_id == user_id)
        .where(models.BillingSubscription.status.in_(ACTIVE_SUBSCRIPTION_STATUSES))
        .where(models.BillingSubscription.ended_at == None)  # noqa: E711
        .order_by(models.BillingSubscription.created_at.desc())
    )
    return session.scalars(stmt).first()


def get_subscription_by_id(
    subscription_id: UUID,
    session: Session,
) -> models.BillingSubscription | None:
    return session.get(models.BillingSubscription, subscription_id)


# Statuses that still grant entitlement but where the paid period may have
# lapsed (payment retry / grace). Kept out of the admin grant-guard so an admin
# can comp a lapsed account.
CURRENT_SUBSCRIPTION_STATUSES = ("trialing", "active")


def get_valid_subscription_for_user(
    user_id: UUID,
    session: Session,
) -> models.BillingSubscription | None:
    """A subscription that is currently valid — active/trialing, not ended, whose
    paid period has started and has not yet passed.

    Distinct from ``get_active_subscriptions_for_user`` (which drives entitlement
    and treats past_due/unpaid and period-passed rows as active). This is the
    single "is the user genuinely subscribed right now?" predicate, shared by the
    admin grant-guard (block only a genuinely-current sub) and the admin search
    `subscribed` flag (so the dashboard's Grant button state matches what the
    grant endpoint will actually do). A lapsed / past_due / not-yet-started /
    webhook-stuck row is NOT valid.

        valid ⇔ status ∈ (active, trialing)
                AND ended_at IS NULL
                AND (current_period_start IS NULL OR current_period_start <= now())
                AND (current_period_end   IS NULL OR current_period_end   >  now())

    A NULL bound is treated as open-ended: NULL start = "already started",
    NULL end = "never expires" (manual comps). Only an explicit future start or
    a past end disqualifies the row.
    """
    now = datetime.now(timezone.utc)
    stmt = (
        select(models.BillingSubscription)
        .join(
            models.BillingCustomer,
            models.BillingSubscription.billing_customer_id == models.BillingCustomer.id,
        )
        .where(models.BillingCustomer.user_id == user_id)
        .where(models.BillingSubscription.status.in_(CURRENT_SUBSCRIPTION_STATUSES))
        .where(models.BillingSubscription.ended_at == None)  # noqa: E711
        .where(
            (models.BillingSubscription.current_period_start == None)  # noqa: E711
            | (models.BillingSubscription.current_period_start <= now)
        )
        .where(
            (models.BillingSubscription.current_period_end == None)  # noqa: E711
            | (models.BillingSubscription.current_period_end > now)
        )
        .order_by(models.BillingSubscription.created_at.desc())
    )
    return session.scalars(stmt).first()


def _active_subscriptions_stmt():
    # Active subscriptions joined to their customer + profile. Shared by the
    # list and count queries so the page total always matches the page rows.
    return (
        select(models.BillingSubscription, models.Profile)
        .join(
            models.BillingCustomer,
            models.BillingSubscription.billing_customer_id == models.BillingCustomer.id,
        )
        .join(
            models.Profile,
            models.BillingCustomer.user_id == models.Profile.id,
        )
        .where(models.BillingSubscription.status.in_(ACTIVE_SUBSCRIPTION_STATUSES))
        .where(models.BillingSubscription.ended_at == None)  # noqa: E711
    )


def list_active_subscriptions_with_profiles(
    session: Session,
    *,
    limit: int,
    offset: int,
) -> list[tuple[models.BillingSubscription, models.Profile]]:
    stmt = (
        _active_subscriptions_stmt()
        .order_by(models.BillingSubscription.current_period_start.desc().nullslast())
        .order_by(models.BillingSubscription.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(session.execute(stmt).all())


def count_active_subscriptions(session: Session) -> int:
    stmt = select(func.count()).select_from(_active_subscriptions_stmt().subquery())
    return session.scalar(stmt) or 0


def create_manual_subscription(
    *,
    billing_customer_id: UUID,
    session: Session,
) -> models.BillingSubscription:
    subscription = models.BillingSubscription(
        billing_customer_id=billing_customer_id,
        provider=MANUAL_PROVIDER,
        external_subscription_id=f"manual_{uuid.uuid4()}",
        external_price_id=MANUAL_PRICE_ID,
        status="active",
        current_period_start=datetime.now(timezone.utc),
        current_period_end=None,  # manual grants never auto-expire
        cancel_at_period_end=False,
    )
    session.add(subscription)
    session.flush()
    return subscription


def end_subscription(
    subscription: models.BillingSubscription,
    session: Session,
) -> models.BillingSubscription:
    now = datetime.now(timezone.utc)
    subscription.status = "canceled"
    subscription.ended_at = now
    subscription.canceled_at = now
    session.flush()
    return subscription


def upsert_subscription(
    *,
    billing_customer_id: UUID,
    provider: str,
    external_subscription_id: str,
    external_price_id: str,
    status: str,
    current_period_start: datetime | int | None,
    current_period_end: datetime | int | None,
    cancel_at_period_end: bool,
    canceled_at: datetime | int | None,
    ended_at: datetime | int | None,
    session: Session,
    raw: dict | None = None,
    event_created_at: datetime | int | None = None,
) -> models.BillingSubscription:
    subscription = get_subscription_by_external_id(
        provider,
        external_subscription_id,
        session,
    )
    event_ts = _coerce_datetime(event_created_at)

    if subscription is None:
        subscription = models.BillingSubscription(
            billing_customer_id=billing_customer_id,
            provider=provider,
            external_subscription_id=external_subscription_id,
            external_price_id=external_price_id,
            status=status,
            current_period_start=_coerce_datetime(current_period_start),
            current_period_end=_coerce_datetime(current_period_end),
            cancel_at_period_end=cancel_at_period_end,
            canceled_at=_coerce_datetime(canceled_at),
            ended_at=_coerce_datetime(ended_at),
            raw=raw,
            last_event_at=event_ts,
        )
        session.add(subscription)
        session.flush()
        return subscription

    # Out-of-order guard: drop updates that are older than what we already have.
    if (
        event_ts is not None
        and subscription.last_event_at is not None
        and event_ts < subscription.last_event_at
    ):
        return subscription

    subscription.billing_customer_id = billing_customer_id
    subscription.provider = provider
    subscription.external_price_id = external_price_id
    subscription.status = status
    subscription.current_period_start = _coerce_datetime(current_period_start)
    subscription.current_period_end = _coerce_datetime(current_period_end)
    subscription.cancel_at_period_end = cancel_at_period_end
    subscription.canceled_at = _coerce_datetime(canceled_at)
    subscription.ended_at = _coerce_datetime(ended_at)
    if raw is not None:
        subscription.raw = raw
    if event_ts is not None:
        subscription.last_event_at = event_ts

    session.flush()
    return subscription


def _coerce_datetime(value: datetime | int | None) -> datetime | None:
    if value is None:
        return None

    if isinstance(value, datetime):
        return value

    return datetime.fromtimestamp(value, tz=timezone.utc)