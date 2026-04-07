from sqlalchemy.orm import Session
from uuid import UUID
from collections.abc import Awaitable, Callable
from typing import Any

from core.config import PRICE_ID
from core.infrastructure.db import models
from core.infrastructure.db.repositories import profiles
from core.infrastructure.db.repositories import billing_customer as billing_customer_repo
from core.infrastructure.db.repositories import billing_subscription as billing_subscription_repo
from core.infrastructure.payment.stripe.gateway import StripeGateway
from core.infrastructure.payment.stripe.webhook import StripeWebhookVerifier
from core.services import exceptions
from core.infrastructure.payment.stripe.exceptions import StripeInfrastructureError

stripe_gateway = StripeGateway()
webhook_verifier = StripeWebhookVerifier()

WebhookHandler = Callable[[Any, Session], Awaitable[None]]


async def start_subscription_checkout(user_id: UUID, db_session: Session) -> str:
    profile: models.Profile = profiles.get_profile_by_id(user_id, db_session)
    if not profile:
        raise exceptions.NotFoundException("User", str(user_id))

    billing_customer = billing_customer_repo.get_customer_by_user_id(user_id, db_session)

    if billing_customer:
        subscription = billing_subscription_repo.get_active_subscriptions(
            billing_customer.id,
            db_session,
        )
    else:
        subscription = None

    if subscription is not None:
        raise exceptions.ConflictException("User already has an active subscription")

    if not PRICE_ID:
        raise exceptions.ValidationException("Stripe price is not configured")

    checkout_session = stripe_gateway.create_subscription_checkout_session(
        user_id=str(user_id),
        email=profile.email,
        stripe_price_id=PRICE_ID,
        stripe_customer_id=(billing_customer.customer_id if billing_customer else None),
    )

    if billing_customer is None and checkout_session.customer_id:
        billing_customer_repo.create_billing_customer(
            user_id=user_id,
            customer_id=checkout_session.customer_id,
            session=db_session,
        )

    if not checkout_session.url:
        raise StripeInfrastructureError("Stripe checkout URL was not returned")

    return checkout_session.url


async def create_customer_portal(user_id: UUID, db_session: Session) -> str:
    profile: models.Profile = profiles.get_profile_by_id(user_id, db_session)
    if not profile:
        raise exceptions.NotFoundException("User", str(user_id))

    billing_customer = billing_customer_repo.get_customer_by_user_id(user_id, db_session)
    if not billing_customer:
        raise exceptions.NotFoundException("Billing customer", str(user_id))

    portal_session = stripe_gateway.create_billing_portal_session(
        stripe_customer_id=billing_customer.customer_id,
    )
    
    if not portal_session.url:
        raise StripeInfrastructureError("Stripe portal URL was not returned")

    return portal_session.url

        
async def handle_stripe_webhook(payload: bytes, signature: str, db_session: Session) -> None:
    event = webhook_verifier.construct_event(
        payload=payload,
        signature=signature,
    )

    event_type = event.event_type
    data = event.data

    handlers: dict[str, WebhookHandler] = {
        "checkout.session.completed": _handle_checkout_session_completed,
        "customer.subscription.created": _handle_subscription_event,
        "customer.subscription.updated": _handle_subscription_event,
        "customer.subscription.deleted": _handle_subscription_event,
    }

    handler = handlers.get(event_type)
    if handler is None:
        return

    await handler(data, db_session)


async def _handle_checkout_session_completed(data: dict, db_session: Session) -> None:
    user_id_raw = data.get("metadata", {}).get("user_id")
    customer_id = data.get("customer")
    subscription_id = data.get("subscription")

    if not user_id_raw or not customer_id:
        return

    user_id = UUID(str(user_id_raw))
    billing_customer = billing_customer_repo.get_customer_by_user_id(user_id, db_session)
    if billing_customer is None:
        billing_customer = billing_customer_repo.create_billing_customer(
            user_id=user_id,
            customer_id=customer_id,
            session=db_session,
        )

    if subscription_id:
        billing_subscription_repo.upsert_subscription_from_stripe(
            billing_customer_id=billing_customer.id,
            stripe_subscription_id=subscription_id,
            stripe_price_id=_extract_price_id(data),
            stripe_status="active",
            current_period_start=None,
            current_period_end=None,
            cancel_at_period_end=False,
            canceled_at=None,
            ended_at=None,
            session=db_session,
        )


async def _handle_subscription_event(data: dict, db_session: Session) -> None:
    subscription_id = data.get("id")
    customer_id = data.get("customer")
    if not subscription_id or not customer_id:
        raise exceptions.ValidationException("Invalid subscription event data")

    billing_customer = billing_customer_repo.get_customer_by_customer_id(customer_id, db_session)
    if billing_customer is None:
        metadata_user_id = data.get("metadata", {}).get("user_id")
        if not metadata_user_id:
            return

        billing_customer = billing_customer_repo.create_billing_customer(
            user_id=UUID(str(metadata_user_id)),
            customer_id=customer_id,
            session=db_session,
        )

    billing_subscription_repo.upsert_subscription_from_stripe(
        billing_customer_id=billing_customer.id,
        stripe_subscription_id=subscription_id,
        stripe_price_id=_extract_price_id(data),
        stripe_status=data.get("status", "incomplete"),
        current_period_start=data.get("current_period_start"),
        current_period_end=data.get("current_period_end"),
        cancel_at_period_end=bool(data.get("cancel_at_period_end", False)),
        canceled_at=data.get("canceled_at"),
        ended_at=data.get("ended_at"),
        session=db_session,
    )


def _extract_price_id(data: dict) -> str:
    items = data.get("items", {}).get("data", [])
    if items:
        first_item = items[0]
        price_id = first_item.get("price", {}).get("id")
        if price_id:
            return price_id

    if data.get("plan", {}).get("id"):
        return data["plan"]["id"]

    return "unknown"