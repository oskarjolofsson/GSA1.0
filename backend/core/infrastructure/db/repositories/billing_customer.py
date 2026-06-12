from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import Session

from core.infrastructure.db import models


def get_customer_by_user_id(
    user_id: UUID,
    session: Session,
) -> models.BillingCustomer | None:
    stmt = select(models.BillingCustomer).where(models.BillingCustomer.user_id == user_id)
    return session.scalar(stmt)


def get_customer_by_customer_id(
    customer_id: str,
    session: Session,
) -> models.BillingCustomer | None:
    stmt = select(models.BillingCustomer).where(models.BillingCustomer.customer_id == customer_id)
    return session.scalar(stmt)


def get_customer_by_user_and_provider(
    user_id: UUID,
    provider: str,
    session: Session,
) -> models.BillingCustomer | None:
    # A user can have one customer row per provider (a Stripe cus_* and a RevenueCat
    # app-user-id). Callers that talk to a specific provider must scope by it — e.g.
    # the Stripe checkout must never receive a RevenueCat customer_id.
    stmt = select(models.BillingCustomer).where(
        models.BillingCustomer.user_id == user_id,
        models.BillingCustomer.provider == provider,
    )
    return session.scalar(stmt)


def create_billing_customer(
    *,
    user_id: UUID,
    customer_id: str,
    session: Session,
    provider: str = "stripe",
) -> models.BillingCustomer:
    billing_customer = models.BillingCustomer(
        user_id=user_id,
        provider=provider,
        customer_id=customer_id,
    )
    session.add(billing_customer)
    session.flush()
    return billing_customer