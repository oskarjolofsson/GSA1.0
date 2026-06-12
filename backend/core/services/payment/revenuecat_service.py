"""RevenueCat webhook ingestion (mobile App Store / Play Store IAP).

RevenueCat is a second billing *provider* alongside Stripe. Mobile purchases made
in the Expo app flow App Store / Play Store -> RevenueCat -> this webhook, and we
fold them into the same provider-agnostic `billing_customers` / `billing_subscriptions`
tables the Stripe path already writes. Entitlement (`entitlement_service`) then
counts any active subscription across providers, so no entitlement change is needed.

Identity: the mobile app sets RevenueCat `appUserID = supabase user.id` after login,
so every event carries our user id in `app_user_id` (and `aliases`). We map straight
to `profiles.id`; there is no anonymous-purchase aliasing to reconcile.
"""

import logging
from uuid import UUID

from sqlalchemy.orm import Session

from core.infrastructure.db.repositories import profiles
from core.infrastructure.db.repositories import billing_customer as billing_customer_repo
from core.infrastructure.db.repositories import billing_subscription as billing_subscription_repo
from core.infrastructure.db.repositories import processed_webhook_events as processed_webhook_repo
from core.infrastructure.payment.revenuecat.webhook import RevenueCatWebhookVerifier
from core.services.payment.serialization import json_safe

logger = logging.getLogger(__name__)

webhook_verifier = RevenueCatWebhookVerifier()

PROVIDER = "revenuecat"

# Events that describe the state of a subscription and so write a row.
_SUBSCRIPTION_EVENTS = frozenset(
    {
        "INITIAL_PURCHASE",
        "RENEWAL",
        "PRODUCT_CHANGE",
        "UNCANCELLATION",
        "CANCELLATION",
        "BILLING_ISSUE",
        "EXPIRATION",
        "SUBSCRIPTION_PAUSED",
        "SUBSCRIPTION_EXTENDED",
    }
)


async def handle_revenuecat_webhook(
    payload: dict,
    authorization: str | None,
    db_session: Session,
) -> None:
    event_dto = webhook_verifier.construct_event(
        payload=payload,
        authorization=authorization,
    )

    # Namespace the idempotency key so a RevenueCat event id can never collide with
    # a Stripe event id in the shared processed_webhook_events table.
    idempotency_key = f"{PROVIDER}:{event_dto.event_id}"
    if processed_webhook_repo.exists(idempotency_key, db_session):
        return

    event = event_dto.data
    event_type = event_dto.event_type

    if event_type == "TRANSFER":
        _handle_transfer(event, db_session)
    elif event_type in _SUBSCRIPTION_EVENTS:
        _handle_subscription_event(event, event_type, event_dto.event_created_at, db_session)
    else:
        # TEST events, NON_RENEWING_PURCHASE, etc. — acknowledge so RevenueCat stops
        # retrying, but nothing to persist.
        logger.info("RevenueCat event %s (%s) ignored", event_dto.event_id, event_type)

    processed_webhook_repo.mark_processed(
        idempotency_key, f"{PROVIDER}.{event_type}", db_session
    )


def _handle_subscription_event(
    event: dict,
    event_type: str,
    event_created_at: int | None,
    db_session: Session,
) -> None:
    user_id = _resolve_user_id(_identity_candidates(event), db_session)
    if user_id is None:
        # Never 500 on an unresolvable user, or RevenueCat retries forever. We still
        # mark the event processed by returning to the caller.
        logger.warning(
            "RevenueCat %s event for unknown app_user_id %r — skipping",
            event_type,
            event.get("app_user_id"),
        )
        return

    customer_key = _customer_key(event)
    billing_customer = billing_customer_repo.get_customer_by_customer_id(
        customer_key, db_session
    )
    if billing_customer is None:
        billing_customer = billing_customer_repo.create_billing_customer(
            user_id=user_id,
            customer_id=customer_key,
            session=db_session,
            provider=PROVIDER,
        )

    fields = _derive_status_fields(event_type, event)

    billing_subscription_repo.upsert_subscription(
        billing_customer_id=billing_customer.id,
        provider=PROVIDER,
        external_subscription_id=_subscription_key(event),
        external_price_id=event.get("product_id") or "unknown",
        status=fields["status"],
        current_period_start=_ms_to_s(event.get("purchased_at_ms")),
        current_period_end=_ms_to_s(event.get("expiration_at_ms")),
        cancel_at_period_end=fields["cancel_at_period_end"],
        canceled_at=fields["canceled_at"],
        ended_at=fields["ended_at"],
        raw=json_safe(event),
        session=db_session,
        event_created_at=event_created_at,
    )


def _handle_transfer(event: dict, db_session: Session) -> None:
    """RevenueCat moved a purchase between app user ids (e.g. store account change).

    Rare given login-before-purchase. We ensure the receiving user has a
    RevenueCat billing customer so the next RENEWAL attaches to the right account;
    full re-assignment of existing subscription rows is intentionally deferred.
    """
    transferred_to = event.get("transferred_to") or []
    user_id = _resolve_user_id(transferred_to, db_session)
    if user_id is None:
        logger.warning(
            "RevenueCat TRANSFER to unresolved users %r — skipping", transferred_to
        )
        return

    customer_key = _customer_key(event)
    if billing_customer_repo.get_customer_by_customer_id(customer_key, db_session) is None:
        billing_customer_repo.create_billing_customer(
            user_id=user_id,
            customer_id=customer_key,
            session=db_session,
            provider=PROVIDER,
        )


def _derive_status_fields(event_type: str, event: dict) -> dict:
    """Map a RevenueCat event onto the Stripe-shaped status fields the schema uses.

    The derived `status` must land inside ACTIVE_SUBSCRIPTION_STATUSES
    (trialing / active / past_due / unpaid) for the row to grant entitlement.
    """
    is_trial = event.get("period_type") == "TRIAL"
    active_status = "trialing" if is_trial else "active"
    event_ts = _ms_to_s(event.get("event_timestamp_ms"))
    expiration = _ms_to_s(event.get("expiration_at_ms"))

    fields = {
        "status": active_status,
        "cancel_at_period_end": False,
        "canceled_at": None,
        "ended_at": None,
    }

    if event_type in (
        "INITIAL_PURCHASE",
        "RENEWAL",
        "PRODUCT_CHANGE",
        "UNCANCELLATION",
        "SUBSCRIPTION_EXTENDED",
    ):
        # UNCANCELLATION/RENEWAL also clear any previously-set cancel flags via the
        # defaults above.
        return fields

    if event_type == "CANCELLATION":
        # Auto-renew turned off (or a refund). The user keeps access until the
        # period expires, so the row stays active with the cancel signal set; the
        # eventual EXPIRATION event ends it.
        fields["cancel_at_period_end"] = True
        fields["canceled_at"] = event_ts
        return fields

    if event_type == "BILLING_ISSUE":
        # Grace/billing-retry period — still entitled, matches Stripe past_due.
        fields["status"] = "past_due"
        return fields

    if event_type in ("EXPIRATION", "SUBSCRIPTION_PAUSED"):
        fields["status"] = "canceled"
        fields["ended_at"] = expiration or event_ts
        return fields

    return fields


def _identity_candidates(event: dict) -> list:
    candidates: list = []
    if event.get("app_user_id"):
        candidates.append(event["app_user_id"])
    candidates.extend(event.get("aliases") or [])
    return candidates


def _resolve_user_id(candidates: list, db_session: Session) -> UUID | None:
    """First candidate that parses as a UUID and matches a real profile wins.

    RevenueCat anonymous ids ($RCAnonymousID:...) fail UUID parsing and are skipped.
    """
    for raw in candidates:
        try:
            user_id = UUID(str(raw))
        except (ValueError, AttributeError, TypeError):
            continue
        if profiles.get_profile_by_id(user_id, db_session):
            return user_id
    return None


def _customer_key(event: dict) -> str:
    # RevenueCat's canonical identity for the buyer. With login-before-purchase this
    # equals the supabase user id; fall back to app_user_id if absent.
    return str(event.get("original_app_user_id") or event.get("app_user_id"))


def _subscription_key(event: dict) -> str:
    # Stable per-subscription identifier across renewals. original_transaction_id is
    # RevenueCat's normalized key (iOS original transaction / Android purchase token);
    # fall back to transaction_id, then product_id.
    return str(
        event.get("original_transaction_id")
        or event.get("transaction_id")
        or event.get("product_id")
        or "unknown"
    )


def _ms_to_s(milliseconds) -> int | None:
    if isinstance(milliseconds, (int, float)):
        return int(milliseconds) // 1000
    return None
