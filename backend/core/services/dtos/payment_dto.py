


# app/infrastructure/stripe/types.py
from dataclasses import dataclass
from typing import Any


@dataclass
class StripeCheckoutSessionResult:
    id: str
    url: str | None
    customer_id: str | None
    subscription_id: str | None
    raw: Any


@dataclass
class StripePortalSessionResult:
    url: str
    raw: Any


@dataclass
class StripeWebhookEvent:
    event_id: str
    event_type: str
    data: dict
    raw: Any
    event_created_at: int | None = None


@dataclass
class RevenueCatWebhookEvent:
    event_id: str
    event_type: str
    # The RevenueCat `event` object (everything under the top-level envelope).
    data: dict
    raw: Any
    # Unix seconds, derived from event_timestamp_ms; used for the out-of-order guard.
    event_created_at: int | None = None