import json
from decimal import Decimal

from sqlalchemy.orm import Session
from uuid import UUID
from collections.abc import Awaitable, Callable
from typing import Any

from core.config import PRICE_ID
from core.infrastructure.db import models
from core.infrastructure.db.repositories import profiles
from core.infrastructure.db.repositories import billing_customer as billing_customer_repo
from core.infrastructure.db.repositories import billing_subscription as billing_subscription_repo
from core.infrastructure.db.repositories import processed_webhook_events as processed_webhook_repo
from core.infrastructure.payment.stripe.gateway import StripeGateway
from core.infrastructure.payment.stripe.webhook import StripeWebhookVerifier
from core.services import exceptions
from core.infrastructure.payment.stripe.exceptions import StripeInfrastructureError

stripe_gateway = StripeGateway()
webhook_verifier = StripeWebhookVerifier()

WebhookHandler = Callable[[Any, Session, int | None], Awaitable[None]]


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

    if processed_webhook_repo.exists(event.event_id, db_session):
        return

    handlers: dict[str, WebhookHandler] = {
        "checkout.session.completed": _handle_checkout_session_completed,
        "customer.subscription.created": _handle_subscription_event,
        "customer.subscription.updated": _handle_subscription_event,
        "customer.subscription.deleted": _handle_subscription_event,
    }

    handler = handlers.get(event.event_type)
    if handler is not None:
        await handler(event.data, db_session, event.event_created_at)

    processed_webhook_repo.mark_processed(event.event_id, event.event_type, db_session)


async def _handle_checkout_session_completed(data: dict, db_session: Session, event_created_at: int | None = None) -> None:
    user_id_raw = data.get("metadata", {}).get("user_id")
    customer_id = data.get("customer")

    if not user_id_raw or not customer_id:
        return

    user_id = UUID(str(user_id_raw))
    billing_customer = billing_customer_repo.get_customer_by_user_id(user_id, db_session)
    if billing_customer is None:
        billing_customer_repo.create_billing_customer(
            user_id=user_id,
            customer_id=customer_id,
            session=db_session,
        )


async def _handle_subscription_event(data: dict, db_session: Session, event_created_at: int | None = None) -> None:
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

    period_start, period_end = _extract_period(data)

    billing_subscription_repo.upsert_subscription(
        billing_customer_id=billing_customer.id,
        provider="stripe",
        external_subscription_id=subscription_id,
        external_price_id=_extract_price_id(data),
        status=data.get("status", "incomplete"),
        current_period_start=period_start,
        current_period_end=period_end,
        cancel_at_period_end=bool(data.get("cancel_at_period_end", False)),
        canceled_at=data.get("canceled_at"),
        ended_at=data.get("ended_at"),
        raw=_json_safe(data),
        session=db_session,
        event_created_at=event_created_at,
    )


def _json_safe(data: dict) -> dict:
    # Stripe payloads contain Decimal values (e.g. plan.amount_decimal) that the
    # default JSON encoder can't serialize into a JSONB column. Round-trip with a
    # Decimal-aware default to coerce everything to plain JSON types.
    return json.loads(json.dumps(data, default=_json_default))


def _json_default(value: Any) -> Any:
    if isinstance(value, Decimal):
        return float(value)
    return str(value)


def _extract_period(data: dict) -> tuple[int | None, int | None]:
    # In current Stripe API versions current_period_start/end live on the
    # subscription *item*, not the subscription object. Fall back to the
    # top-level fields for older payloads.
    items = data.get("items", {}).get("data", [])
    if items:
        first_item = items[0]
        start = first_item.get("current_period_start")
        end = first_item.get("current_period_end")
        if start is not None or end is not None:
            return start, end

    return data.get("current_period_start"), data.get("current_period_end")


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