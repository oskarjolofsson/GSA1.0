"""End-to-end webhook integration test — NOTHING is mocked.

Unlike test_billing_webhooks.py (which stubs construct_event), this signs a
realistic Stripe event with the webhook secret and drives it through the full
stack: HTTP endpoint -> real stripe.Webhook.construct_event -> billing_service
-> period extraction -> JSON-safe raw -> real DB write.

This is the test class that would have caught every live-boundary bug we hit
during manual testing (wrong webhook path, client.webhooks AttributeError,
periods on items, Decimal not JSON-serializable).
"""

import hashlib
import hmac
import json
import time

import pytest

from core.infrastructure.db.repositories import billing_customer as billing_customer_repo
from core.infrastructure.db.repositories import billing_subscription as billing_subscription_repo
from core.infrastructure.payment.stripe import webhook as webhook_module

WEBHOOK_URL = "/api/v1/webhook/stripe/"
TEST_SECRET = "whsec_integration_test_secret"


def _sign(payload: bytes, secret: str = TEST_SECRET) -> str:
    timestamp = int(time.time())
    signed = f"{timestamp}.".encode() + payload
    sig = hmac.new(secret.encode(), signed, hashlib.sha256).hexdigest()
    return f"t={timestamp},v1={sig}"


@pytest.fixture(autouse=True)
def _patch_webhook_secret(monkeypatch):
    monkeypatch.setattr(webhook_module, "STRIPE_WEBHOOK_SECRET", TEST_SECRET)


def test_subscription_created_event_flows_end_to_end(client, db_session, test_user):
    billing_customer_repo.create_billing_customer(
        user_id=test_user["user_id"],
        customer_id="cus_integration",
        session=db_session,
    )

    period_start = 1_710_000_000
    period_end = 1_710_086_400
    event = {
        "id": "evt_integration_created",
        "object": "event",
        "type": "customer.subscription.created",
        "created": 1_710_000_001,
        "data": {
            "object": {
                "id": "sub_integration_123",
                "object": "subscription",
                "customer": "cus_integration",
                "status": "active",
                "cancel_at_period_end": False,
                "canceled_at": None,
                "ended_at": None,
                "items": {
                    "object": "list",
                    "data": [
                        {
                            "id": "si_1",
                            "object": "subscription_item",
                            "current_period_start": period_start,
                            "current_period_end": period_end,
                            # amount_decimal is the field that arrives as a
                            # non-JSON-native value and broke the JSONB insert.
                            "price": {
                                "id": "price_integration_123",
                                "object": "price",
                                "unit_amount": 999,
                                "unit_amount_decimal": "999",
                            },
                        }
                    ],
                },
            }
        },
    }
    payload = json.dumps(event).encode()

    response = client.post(
        WEBHOOK_URL,
        content=payload,
        headers={"Stripe-Signature": _sign(payload)},
    )

    assert response.status_code == 200
    assert response.json() == {"received": True}

    subscription = billing_subscription_repo.get_subscription_by_external_id(
        "stripe",
        "sub_integration_123",
        db_session,
    )
    assert subscription is not None
    assert subscription.provider == "stripe"
    assert subscription.status == "active"
    assert subscription.external_price_id == "price_integration_123"
    # The bug we shipped: these were NULL because the code read them off the
    # subscription object instead of the item.
    assert subscription.current_period_start is not None
    assert subscription.current_period_end is not None
    # raw must round-trip into JSONB without a serialization error.
    assert subscription.raw["id"] == "sub_integration_123"


def test_invalid_signature_is_rejected(client, db_session, test_user):
    payload = json.dumps(
        {
            "id": "evt_bad_sig",
            "object": "event",
            "type": "customer.subscription.created",
            "data": {"object": {"id": "sub_bad", "items": {"data": []}}},
        }
    ).encode()

    response = client.post(
        WEBHOOK_URL,
        content=payload,
        headers={"Stripe-Signature": _sign(payload, secret="whsec_wrong")},
    )

    # The endpoint surfaces verification failure rather than writing anything.
    assert response.status_code >= 400
    assert (
        billing_subscription_repo.get_subscription_by_external_id(
            "stripe", "sub_bad", db_session
        )
        is None
    )
