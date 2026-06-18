"""Unit tests for the RevenueCat webhook plumbing (no DB, no network).

Covers the auth verifier, the RevenueCat-event -> Stripe-shaped status mapping, and
the small id-extraction helpers. The DB-backed end-to-end behaviour lives in
tests/api/billing/test_revenuecat_webhook.py.
"""

import pytest

from core.infrastructure.payment.revenuecat.exceptions import (
    RevenueCatWebhookVerificationError,
)
from core.infrastructure.payment.revenuecat.webhook import RevenueCatWebhookVerifier
from core.services.payment import revenuecat_service as svc

TEST_TOKEN = "rc_test_auth_token"


def _verifier() -> RevenueCatWebhookVerifier:
    return RevenueCatWebhookVerifier(expected_token=TEST_TOKEN)


def _event(**overrides) -> dict:
    event = {
        "id": "rc_evt_1",
        "type": "INITIAL_PURCHASE",
        "event_timestamp_ms": 1_710_000_000_000,
        "app_user_id": "11111111-1111-1111-1111-111111111111",
        "original_app_user_id": "11111111-1111-1111-1111-111111111111",
        "product_id": "premium_monthly",
        "period_type": "NORMAL",
        "purchased_at_ms": 1_710_000_000_000,
        "expiration_at_ms": 1_712_678_400_000,
        "original_transaction_id": "100000123456789",
        "store": "APP_STORE",
        "environment": "PRODUCTION",
    }
    event.update(overrides)
    return event


# --- verifier / auth -------------------------------------------------------

def test_verifier_rejects_missing_authorization():
    with pytest.raises(RevenueCatWebhookVerificationError):
        _verifier().construct_event(payload={"event": _event()}, authorization=None)


def test_verifier_rejects_wrong_authorization():
    with pytest.raises(RevenueCatWebhookVerificationError):
        _verifier().construct_event(payload={"event": _event()}, authorization="nope")


def test_verifier_rejects_missing_event_object():
    with pytest.raises(RevenueCatWebhookVerificationError):
        _verifier().construct_event(payload={}, authorization=TEST_TOKEN)


def test_verifier_fails_closed_when_secret_unset():
    verifier = RevenueCatWebhookVerifier(expected_token="")
    with pytest.raises(RevenueCatWebhookVerificationError):
        verifier.construct_event(payload={"event": _event()}, authorization="")


def test_verifier_parses_valid_event():
    dto = _verifier().construct_event(
        payload={"event": _event()}, authorization=TEST_TOKEN
    )
    assert dto.event_id == "rc_evt_1"
    assert dto.event_type == "INITIAL_PURCHASE"
    # event_timestamp_ms (ms) -> seconds
    assert dto.event_created_at == 1_710_000_000


# --- status mapping --------------------------------------------------------

@pytest.mark.parametrize(
    "event_type",
    ["INITIAL_PURCHASE", "RENEWAL", "PRODUCT_CHANGE", "UNCANCELLATION", "SUBSCRIPTION_EXTENDED"],
)
def test_active_events_map_to_active(event_type):
    fields = svc._derive_status_fields(event_type, _event())
    assert fields["status"] == "active"
    assert fields["cancel_at_period_end"] is False
    assert fields["canceled_at"] is None
    assert fields["ended_at"] is None


def test_trial_period_maps_to_trialing():
    fields = svc._derive_status_fields("INITIAL_PURCHASE", _event(period_type="TRIAL"))
    assert fields["status"] == "trialing"


def test_cancellation_keeps_access_but_sets_cancel_flags():
    fields = svc._derive_status_fields("CANCELLATION", _event())
    # Still entitled until expiration, matches the Stripe at-period-end behaviour.
    assert fields["status"] == "active"
    assert fields["cancel_at_period_end"] is True
    assert fields["canceled_at"] == 1_710_000_000


def test_billing_issue_maps_to_past_due():
    fields = svc._derive_status_fields("BILLING_ISSUE", _event())
    assert fields["status"] == "past_due"


@pytest.mark.parametrize("event_type", ["EXPIRATION", "SUBSCRIPTION_PAUSED"])
def test_terminal_events_end_the_subscription(event_type):
    fields = svc._derive_status_fields(event_type, _event())
    assert fields["status"] == "canceled"
    assert fields["ended_at"] is not None


# --- environment gate ------------------------------------------------------

def test_environment_matches_when_equal(monkeypatch):
    monkeypatch.setattr(svc, "EXPECTED_REVENUECAT_ENV", "PRODUCTION")
    assert svc._environment_matches(_event(environment="PRODUCTION")) is True


def test_environment_rejected_when_different(monkeypatch):
    # Backend honors PRODUCTION; a SANDBOX event (fanned out by RevenueCat) is rejected.
    monkeypatch.setattr(svc, "EXPECTED_REVENUECAT_ENV", "PRODUCTION")
    assert svc._environment_matches(_event(environment="SANDBOX")) is False


def test_environment_matches_sandbox_backend(monkeypatch):
    monkeypatch.setattr(svc, "EXPECTED_REVENUECAT_ENV", "SANDBOX")
    assert svc._environment_matches(_event(environment="SANDBOX")) is True
    assert svc._environment_matches(_event(environment="PRODUCTION")) is False


def test_environment_missing_is_allowed(monkeypatch):
    # Absent/unknown environment is let through — auth already proved origin.
    monkeypatch.setattr(svc, "EXPECTED_REVENUECAT_ENV", "PRODUCTION")
    event = _event()
    event.pop("environment", None)
    assert svc._environment_matches(event) is True


# --- id / time helpers -----------------------------------------------------

def test_subscription_key_prefers_original_transaction_id():
    assert svc._subscription_key(_event()) == "100000123456789"


def test_subscription_key_falls_back_to_transaction_then_product():
    assert svc._subscription_key(
        {"transaction_id": "tx_9", "product_id": "p"}
    ) == "tx_9"
    assert svc._subscription_key({"product_id": "premium_monthly"}) == "premium_monthly"


def test_customer_key_prefers_original_app_user_id():
    assert svc._customer_key(_event()) == "11111111-1111-1111-1111-111111111111"


def test_ms_to_s_converts_and_handles_none():
    assert svc._ms_to_s(1_710_000_000_000) == 1_710_000_000
    assert svc._ms_to_s(None) is None


def test_identity_candidates_includes_app_user_id_and_aliases():
    event = _event(aliases=["alias-a", "alias-b"])
    candidates = svc._identity_candidates(event)
    assert event["app_user_id"] in candidates
    assert "alias-a" in candidates and "alias-b" in candidates
