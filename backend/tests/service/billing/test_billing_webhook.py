"""Tests for the real StripeWebhookVerifier.construct_event path.

These deliberately do NOT mock construct_event — every other webhook test
stubs it out, which is exactly why a broken Stripe SDK call slipped through.
Here we sign a payload with the configured secret and run it through the
actual Stripe SDK so the SDK call surface is genuinely exercised.
"""

import hashlib
import hmac
import json
import time

import pytest
import stripe

from core.infrastructure.payment.stripe import webhook as webhook_module
from core.infrastructure.payment.stripe.exceptions import StripeWebhookVerificationError

TEST_SECRET = "whsec_test_secret_for_unit_tests"


def _sign(payload: bytes, secret: str, timestamp: int | None = None) -> str:
    """Build a Stripe-Signature header the way Stripe does."""
    timestamp = timestamp if timestamp is not None else int(time.time())
    signed_payload = f"{timestamp}.".encode() + payload
    signature = hmac.new(
        secret.encode(),
        signed_payload,
        hashlib.sha256,
    ).hexdigest()
    return f"t={timestamp},v1={signature}"


@pytest.fixture(autouse=True)
def _patch_secret(monkeypatch):
    # construct_event reads the module-level STRIPE_WEBHOOK_SECRET.
    monkeypatch.setattr(webhook_module, "STRIPE_WEBHOOK_SECRET", TEST_SECRET)


def test_construct_event_parses_a_validly_signed_payload():
    verifier = webhook_module.StripeWebhookVerifier()
    payload = json.dumps(
        {
            "id": "evt_real_123",
            "object": "event",
            "type": "checkout.session.completed",
            "created": 1_700_000_000,
            "data": {"object": {"id": "cs_test_123", "customer": "cus_123"}},
        }
    ).encode()

    event = verifier.construct_event(
        payload=payload,
        signature=_sign(payload, TEST_SECRET),
    )

    assert event.event_id == "evt_real_123"
    assert event.event_type == "checkout.session.completed"
    assert event.event_created_at == 1_700_000_000
    assert event.data == {"id": "cs_test_123", "customer": "cus_123"}


def test_construct_event_rejects_an_invalid_signature():
    verifier = webhook_module.StripeWebhookVerifier()
    payload = b'{"id":"evt_x","type":"checkout.session.completed","data":{"object":{}}}'

    with pytest.raises(StripeWebhookVerificationError):
        verifier.construct_event(
            payload=payload,
            signature=_sign(payload, "whsec_the_wrong_secret"),
        )


def test_construct_event_uses_the_real_sdk_entrypoint():
    """Guards against SDK drift: stripe.Webhook.construct_event must exist.

    The original bug was calling client.webhooks.construct_event, which does
    not exist on StripeClient. This asserts the entrypoint we depend on.
    """
    assert hasattr(stripe.Webhook, "construct_event")


def test_construct_event_does_not_mask_real_bugs_as_signature_errors(monkeypatch):
    """A non-signature error must propagate, not be relabeled as a bad signature."""

    def boom(*args, **kwargs):
        raise AttributeError("simulated SDK misuse")

    monkeypatch.setattr(stripe.Webhook, "construct_event", boom)
    verifier = webhook_module.StripeWebhookVerifier()
    payload = b'{"id":"evt_x","type":"checkout.session.completed","data":{"object":{}}}'

    with pytest.raises(AttributeError):
        verifier.construct_event(
            payload=payload,
            signature=_sign(payload, TEST_SECRET),
        )
