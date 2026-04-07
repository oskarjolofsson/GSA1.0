
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from core.infrastructure.db import models

ACTIVE_SUBSCRIPTION_STATUSES = ("trialing", "active", "past_due", "unpaid")


def get_subscription_by_stripe_subscription_id(
    stripe_subscription_id: str,
    session: Session,
) -> models.BillingSubscription | None:
    stmt = select(models.BillingSubscription).where(
        models.BillingSubscription.stripe_subscription_id == stripe_subscription_id
    )
    return session.scalar(stmt)


def get_active_subscriptions(
    billing_customer_id: UUID,
    session: Session,
) -> models.BillingSubscription | None:
    stmt = (
        select(models.BillingSubscription)
        .where(models.BillingSubscription.billing_customer_id == billing_customer_id)
        .where(models.BillingSubscription.stripe_status.in_(ACTIVE_SUBSCRIPTION_STATUSES))
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
        .where(models.BillingSubscription.stripe_status.in_(ACTIVE_SUBSCRIPTION_STATUSES))
        .where(models.BillingSubscription.ended_at == None)  # noqa: E711
        .order_by(models.BillingSubscription.created_at.desc())
    )
    return session.scalars(stmt).first()


def upsert_subscription_from_stripe(
    *,
    billing_customer_id: UUID,
    stripe_subscription_id: str,
    stripe_price_id: str,
    stripe_status: str,
    current_period_start: datetime | int | None,
    current_period_end: datetime | int | None,
    cancel_at_period_end: bool,
    canceled_at: datetime | int | None,
    ended_at: datetime | int | None,
    session: Session,
) -> models.BillingSubscription:
    subscription = get_subscription_by_stripe_subscription_id(
        stripe_subscription_id,
        session,
    )

    if subscription is None:
        subscription = models.BillingSubscription(
            billing_customer_id=billing_customer_id,
            stripe_subscription_id=stripe_subscription_id,
            stripe_price_id=stripe_price_id,
            stripe_status=stripe_status,
            current_period_start=_coerce_datetime(current_period_start),
            current_period_end=_coerce_datetime(current_period_end),
            cancel_at_period_end=cancel_at_period_end,
            canceled_at=_coerce_datetime(canceled_at),
            ended_at=_coerce_datetime(ended_at),
        )
        session.add(subscription)
        session.flush()
        return subscription

    subscription.billing_customer_id = billing_customer_id
    subscription.stripe_price_id = stripe_price_id
    subscription.stripe_status = stripe_status
    subscription.current_period_start = _coerce_datetime(current_period_start)
    subscription.current_period_end = _coerce_datetime(current_period_end)
    subscription.cancel_at_period_end = cancel_at_period_end
    subscription.canceled_at = _coerce_datetime(canceled_at)
    subscription.ended_at = _coerce_datetime(ended_at)

    session.flush()
    return subscription


def _coerce_datetime(value: datetime | int | None) -> datetime | None:
    if value is None:
        return None

    if isinstance(value, datetime):
        return value

    return datetime.fromtimestamp(value, tz=timezone.utc)