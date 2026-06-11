"""End-to-end RevenueCat webhook tests — full stack, real DB writes.

Drives JSON RevenueCat events through the HTTP endpoint -> auth verification ->
revenuecat_service -> provider-agnostic billing repos -> real DB, then asserts the
rows and the entitlement/status surface. Mirrors test_webhook_integration.py for
the Stripe path.
"""

import pytest

from core.infrastructure.db.repositories import billing_customer as billing_customer_repo
from core.infrastructure.db.repositories import billing_subscription as billing_subscription_repo
from core.infrastructure.payment.revenuecat import webhook as rc_webhook_module
from core.services.payment import entitlement_service

WEBHOOK_URL = "/api/v1/webhook/revenuecat/"
TEST_TOKEN = "rc_integration_test_token"

# A safe window so "active" rows are not filtered out by any time logic.
PURCHASED_AT_MS = 1_710_000_000_000
EXPIRATION_AT_MS = 4_102_444_800_000  # year 2100


@pytest.fixture(autouse=True)
def _patch_rc_token(monkeypatch):
    monkeypatch.setattr(rc_webhook_module, "REVENUECAT_WEBHOOK_AUTH_TOKEN", TEST_TOKEN)


def _event(user_id, **overrides) -> dict:
    event = {
        "id": "rc_evt_default",
        "type": "INITIAL_PURCHASE",
        "event_timestamp_ms": PURCHASED_AT_MS,
        "app_user_id": str(user_id),
        "original_app_user_id": str(user_id),
        "product_id": "premium_monthly",
        "period_type": "NORMAL",
        "purchased_at_ms": PURCHASED_AT_MS,
        "expiration_at_ms": EXPIRATION_AT_MS,
        "original_transaction_id": "rc_txn_default",
        "store": "APP_STORE",
        "environment": "PRODUCTION",
    }
    event.update(overrides)
    return event


def _post(client, event, token=TEST_TOKEN):
    return client.post(
        WEBHOOK_URL,
        json={"api_version": "1.0", "event": event},
        headers={"Authorization": token} if token is not None else {},
    )


def _get_sub(db_session, txn_id="rc_txn_default"):
    return billing_subscription_repo.get_subscription_by_external_id(
        "revenuecat", txn_id, db_session
    )


# --- auth ------------------------------------------------------------------

def test_missing_authorization_is_rejected(client, db_session, test_user):
    resp = _post(client, _event(test_user["user_id"]), token=None)
    assert resp.status_code == 401
    assert _get_sub(db_session) is None


def test_wrong_authorization_is_rejected(client, db_session, test_user):
    resp = _post(client, _event(test_user["user_id"]), token="wrong")
    assert resp.status_code == 401
    assert _get_sub(db_session) is None


# --- happy path ------------------------------------------------------------

def test_initial_purchase_creates_customer_and_subscription(client, db_session, test_user):
    resp = _post(client, _event(test_user["user_id"], id="rc_evt_initial"))
    assert resp.status_code == 200
    assert resp.json() == {"received": True}

    customer = billing_customer_repo.get_customer_by_customer_id(
        str(test_user["user_id"]), db_session
    )
    assert customer is not None
    assert customer.provider == "revenuecat"

    sub = _get_sub(db_session)
    assert sub is not None
    assert sub.provider == "revenuecat"
    assert sub.status == "active"
    assert sub.external_price_id == "premium_monthly"
    assert sub.current_period_end is not None


def test_initial_purchase_with_trial_is_trialing(client, db_session, test_user):
    resp = _post(
        client,
        _event(test_user["user_id"], id="rc_evt_trial", period_type="TRIAL"),
    )
    assert resp.status_code == 200
    assert _get_sub(db_session).status == "trialing"


def test_renewal_updates_period(client, db_session, test_user):
    _post(client, _event(test_user["user_id"], id="rc_evt_p1"))
    new_expiry = EXPIRATION_AT_MS + 2_592_000_000  # +30 days
    resp = _post(
        client,
        _event(
            test_user["user_id"],
            id="rc_evt_renew",
            type="RENEWAL",
            event_timestamp_ms=PURCHASED_AT_MS + 1000,
            expiration_at_ms=new_expiry,
        ),
    )
    assert resp.status_code == 200
    sub = _get_sub(db_session)
    assert sub.status == "active"
    assert int(sub.current_period_end.timestamp()) == new_expiry // 1000


def test_cancellation_keeps_entitlement(client, db_session, test_user):
    _post(client, _event(test_user["user_id"], id="rc_evt_c1"))
    resp = _post(
        client,
        _event(
            test_user["user_id"],
            id="rc_evt_cancel",
            type="CANCELLATION",
            event_timestamp_ms=PURCHASED_AT_MS + 1000,
        ),
    )
    assert resp.status_code == 200
    sub = _get_sub(db_session)
    assert sub.status == "active"  # still entitled until expiration
    assert sub.cancel_at_period_end is True
    assert sub.canceled_at is not None
    assert entitlement_service.is_subscribed(test_user["user_id"], db_session) is True


def test_billing_issue_is_past_due_but_still_entitled(client, db_session, test_user):
    _post(client, _event(test_user["user_id"], id="rc_evt_b1"))
    _post(
        client,
        _event(
            test_user["user_id"],
            id="rc_evt_billing",
            type="BILLING_ISSUE",
            event_timestamp_ms=PURCHASED_AT_MS + 1000,
        ),
    )
    sub = _get_sub(db_session)
    assert sub.status == "past_due"
    assert entitlement_service.is_subscribed(test_user["user_id"], db_session) is True


def test_expiration_ends_and_revokes(client, db_session, test_user):
    _post(client, _event(test_user["user_id"], id="rc_evt_e1"))
    _post(
        client,
        _event(
            test_user["user_id"],
            id="rc_evt_expire",
            type="EXPIRATION",
            event_timestamp_ms=PURCHASED_AT_MS + 1000,
        ),
    )
    sub = _get_sub(db_session)
    assert sub.status == "canceled"
    assert sub.ended_at is not None
    # get_active_subscriptions_for_user filters ended_at != null -> no longer entitled.
    assert entitlement_service.is_subscribed(test_user["user_id"], db_session) is False


# --- robustness ------------------------------------------------------------

def test_duplicate_event_is_idempotent(client, db_session, test_user):
    event = _event(test_user["user_id"], id="rc_evt_dupe")
    first = _post(client, event)
    second = _post(client, event)
    assert first.status_code == 200 and second.status_code == 200
    # Still exactly one row; the second delivery was a no-op.
    assert _get_sub(db_session) is not None


def test_out_of_order_event_is_ignored(client, db_session, test_user):
    # Newer renewal first, then an older purchase event for the same subscription.
    new_expiry = EXPIRATION_AT_MS + 2_592_000_000
    _post(
        client,
        _event(
            test_user["user_id"],
            id="rc_evt_new",
            type="RENEWAL",
            event_timestamp_ms=PURCHASED_AT_MS + 5000,
            expiration_at_ms=new_expiry,
        ),
    )
    _post(
        client,
        _event(
            test_user["user_id"],
            id="rc_evt_old",
            type="RENEWAL",
            event_timestamp_ms=PURCHASED_AT_MS + 1000,
            expiration_at_ms=EXPIRATION_AT_MS,
        ),
    )
    sub = _get_sub(db_session)
    # The older event must not clobber the newer period.
    assert int(sub.current_period_end.timestamp()) == new_expiry // 1000


def test_unknown_app_user_id_is_acknowledged_without_writing(client, db_session, test_user):
    resp = _post(
        client,
        _event(
            "99999999-9999-9999-9999-999999999999",
            id="rc_evt_unknown",
            original_app_user_id="99999999-9999-9999-9999-999999999999",
            original_transaction_id="rc_txn_unknown",
        ),
    )
    assert resp.status_code == 200  # never 500, so RevenueCat stops retrying
    assert _get_sub(db_session, "rc_txn_unknown") is None


def test_transfer_creates_customer_for_receiving_user(client, db_session, test_user):
    resp = _post(
        client,
        {
            "id": "rc_evt_transfer",
            "type": "TRANSFER",
            "event_timestamp_ms": PURCHASED_AT_MS,
            "store": "APP_STORE",
            "environment": "PRODUCTION",
            "original_app_user_id": str(test_user["user_id"]),
            "transferred_to": [str(test_user["user_id"])],
            "transferred_from": ["88888888-8888-8888-8888-888888888888"],
        },
    )
    assert resp.status_code == 200
    assert (
        billing_customer_repo.get_customer_by_customer_id(
            str(test_user["user_id"]), db_session
        )
        is not None
    )


# --- status surface --------------------------------------------------------

def test_status_endpoint_reports_revenuecat_provider(client, db_session, test_user, auth_headers):
    _post(client, _event(test_user["user_id"], id="rc_evt_status"))
    resp = client.get("/api/v1/billing/status", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["is_subscribed"] is True
    assert body["subscription"]["provider"] == "revenuecat"
