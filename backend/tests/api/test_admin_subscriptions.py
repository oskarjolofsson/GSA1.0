"""API tests for admin subscription management.

Hits a real Supabase test DB (per tests/conftest.py). `test_user` creates a real
auth user, which the handle_new_user trigger mirrors into `profiles` — so grants
against test_user["user_id"] resolve to a real profile. All billing rows are
written inside the rolled-back db_session transaction, so tests stay isolated.
"""

import uuid
from datetime import datetime, timedelta, timezone

import pytest

from core.services import user_service
from core.services.payment import entitlement_service
from core.infrastructure.db.repositories import billing_customer as billing_customer_repo
from core.infrastructure.db.repositories import billing_subscription as billing_subscription_repo


@pytest.fixture()
def admin_headers(test_user, db_session, auth_headers):
    user_service.set_admin(
        user_id=str(test_user["user_id"]), set_to_admin=True, session=db_session
    )
    return auth_headers


# --------------------------- admin gate ---------------------------


def test_list_requires_admin(client, auth_headers):
    response = client.get("/api/v1/admin/subscriptions/", headers=auth_headers)
    assert response.status_code == 403


def test_search_requires_admin(client, auth_headers):
    response = client.get("/api/v1/admin/subscriptions/search/?q=test", headers=auth_headers)
    assert response.status_code == 403


def test_grant_requires_admin(client, auth_headers, test_user):
    response = client.post(
        "/api/v1/admin/subscriptions/",
        headers=auth_headers,
        json={"user_id": str(test_user["user_id"])},
    )
    assert response.status_code == 403


def test_revoke_requires_admin(client, auth_headers):
    response = client.delete(
        f"/api/v1/admin/subscriptions/{uuid.uuid4()}/", headers=auth_headers
    )
    assert response.status_code == 403


# --------------------------- grant ---------------------------


def test_grant_creates_active_subscription(client, admin_headers, test_user, db_session):
    user_id = test_user["user_id"]

    response = client.post(
        "/api/v1/admin/subscriptions/",
        headers=admin_headers,
        json={"user_id": str(user_id)},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["user_id"] == str(user_id)
    assert data["provider"] == "manual"
    assert data["status"] == "active"
    assert entitlement_service.is_subscribed(user_id, db_session) is True


def test_grant_twice_returns_409(client, admin_headers, test_user):
    body = {"user_id": str(test_user["user_id"])}
    first = client.post("/api/v1/admin/subscriptions/", headers=admin_headers, json=body)
    assert first.status_code == 201

    second = client.post("/api/v1/admin/subscriptions/", headers=admin_headers, json=body)
    assert second.status_code == 409


def _seed_stripe_sub(db_session, user_id, *, status, current_period_end, ended_at=None):
    """Seed a provider='stripe' subscription row in the given state."""
    customer = billing_customer_repo.create_billing_customer(
        user_id=user_id,
        customer_id=f"cus_test_{uuid.uuid4().hex[:12]}",
        provider="stripe",
        session=db_session,
    )
    return billing_subscription_repo.upsert_subscription(
        billing_customer_id=customer.id,
        provider="stripe",
        external_subscription_id=f"sub_test_{uuid.uuid4().hex[:12]}",
        external_price_id="price_test",
        status=status,
        current_period_start=None,
        current_period_end=current_period_end,
        cancel_at_period_end=False,
        canceled_at=None,
        ended_at=ended_at,
        session=db_session,
    )


def test_grant_allowed_when_existing_sub_period_expired(client, admin_headers, test_user, db_session):
    # status still "active" and ended_at null (webhook never ended it), but the
    # paid period has passed — admin must be able to comp them.
    past = datetime.now(timezone.utc) - timedelta(days=3)
    _seed_stripe_sub(db_session, test_user["user_id"], status="active", current_period_end=past)

    response = client.post(
        "/api/v1/admin/subscriptions/",
        headers=admin_headers,
        json={"user_id": str(test_user["user_id"])},
    )
    assert response.status_code == 201


def test_grant_allowed_when_existing_sub_past_due(client, admin_headers, test_user, db_session):
    future = datetime.now(timezone.utc) + timedelta(days=3)
    _seed_stripe_sub(db_session, test_user["user_id"], status="past_due", current_period_end=future)

    response = client.post(
        "/api/v1/admin/subscriptions/",
        headers=admin_headers,
        json={"user_id": str(test_user["user_id"])},
    )
    assert response.status_code == 201


def test_grant_blocked_when_existing_sub_still_valid(client, admin_headers, test_user, db_session):
    # active + period in the future = genuinely current → still blocks.
    future = datetime.now(timezone.utc) + timedelta(days=10)
    _seed_stripe_sub(db_session, test_user["user_id"], status="active", current_period_end=future)

    response = client.post(
        "/api/v1/admin/subscriptions/",
        headers=admin_headers,
        json={"user_id": str(test_user["user_id"])},
    )
    assert response.status_code == 409


def test_grant_unknown_user_returns_404(client, admin_headers):
    response = client.post(
        "/api/v1/admin/subscriptions/",
        headers=admin_headers,
        json={"user_id": str(uuid.uuid4())},
    )
    assert response.status_code == 404


# --------------------------- list ---------------------------


def test_list_includes_granted_subscriber(client, admin_headers, test_user):
    user_id = test_user["user_id"]
    client.post(
        "/api/v1/admin/subscriptions/", headers=admin_headers, json={"user_id": str(user_id)}
    )

    response = client.get("/api/v1/admin/subscriptions/", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert set(data.keys()) == {"items", "total", "limit", "offset"}
    assert data["limit"] == 10
    assert data["offset"] == 0
    assert data["total"] >= 1

    match = next(item for item in data["items"] if item["user_id"] == str(user_id))
    assert match["provider"] == "manual"
    assert match["status"] == "active"


def test_list_respects_limit(client, admin_headers, test_user):
    client.post(
        "/api/v1/admin/subscriptions/",
        headers=admin_headers,
        json={"user_id": str(test_user["user_id"])},
    )
    response = client.get("/api/v1/admin/subscriptions/?limit=1&offset=0", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["limit"] == 1
    assert len(data["items"]) <= 1


def test_list_rejects_out_of_range_limit(client, admin_headers):
    response = client.get("/api/v1/admin/subscriptions/?limit=999", headers=admin_headers)
    assert response.status_code == 422


# --------------------------- search ---------------------------


def test_search_finds_subscribed_profile(client, admin_headers, test_user):
    user_id = test_user["user_id"]
    client.post(
        "/api/v1/admin/subscriptions/", headers=admin_headers, json={"user_id": str(user_id)}
    )

    response = client.get(
        f"/api/v1/admin/subscriptions/search/?q={test_user['email']}", headers=admin_headers
    )
    assert response.status_code == 200
    results = response.json()
    match = next(r for r in results if r["user_id"] == str(user_id))
    assert match["subscribed"] is True
    assert match["provider"] == "manual"


def test_search_unsubscribed_profile(client, admin_headers, test_user):
    response = client.get(
        f"/api/v1/admin/subscriptions/search/?q={test_user['email']}", headers=admin_headers
    )
    assert response.status_code == 200
    results = response.json()
    match = next(r for r in results if r["user_id"] == str(test_user["user_id"]))
    assert match["subscribed"] is False
    assert match["provider"] is None


def test_search_expired_sub_shows_not_subscribed(client, admin_headers, test_user, db_session):
    # A period-passed (webhook-stuck) row must show subscribed=false so the
    # dashboard offers Grant — matching the grant-guard.
    past = datetime.now(timezone.utc) - timedelta(days=3)
    _seed_stripe_sub(db_session, test_user["user_id"], status="active", current_period_end=past)

    response = client.get(
        f"/api/v1/admin/subscriptions/search/?q={test_user['email']}", headers=admin_headers
    )
    assert response.status_code == 200
    match = next(r for r in response.json() if r["user_id"] == str(test_user["user_id"]))
    assert match["subscribed"] is False
    assert match["provider"] is None


def test_search_no_match_returns_empty(client, admin_headers):
    response = client.get(
        "/api/v1/admin/subscriptions/search/?q=zzz-no-such-profile-zzz", headers=admin_headers
    )
    assert response.status_code == 200
    assert response.json() == []


# --------------------------- revoke ---------------------------


def test_revoke_soft_ends_subscription(client, admin_headers, test_user, db_session):
    user_id = test_user["user_id"]
    granted = client.post(
        "/api/v1/admin/subscriptions/", headers=admin_headers, json={"user_id": str(user_id)}
    ).json()
    subscription_id = granted["subscription_id"]

    response = client.delete(
        f"/api/v1/admin/subscriptions/{subscription_id}/", headers=admin_headers
    )
    assert response.status_code == 204
    assert entitlement_service.is_subscribed(user_id, db_session) is False

    row = billing_subscription_repo.get_subscription_by_id(
        uuid.UUID(subscription_id), db_session
    )
    assert row is not None
    assert row.status == "canceled"
    assert row.ended_at is not None


def test_revoke_unknown_subscription_returns_404(client, admin_headers):
    response = client.delete(
        f"/api/v1/admin/subscriptions/{uuid.uuid4()}/", headers=admin_headers
    )
    assert response.status_code == 404


def test_revoke_non_manual_returns_409(client, admin_headers, test_user, db_session):
    # Seed a Stripe-provider subscription; admin panel must refuse to revoke it.
    customer = billing_customer_repo.create_billing_customer(
        user_id=test_user["user_id"],
        customer_id=f"cus_test_{uuid.uuid4().hex[:12]}",
        provider="stripe",
        session=db_session,
    )
    sub = billing_subscription_repo.upsert_subscription(
        billing_customer_id=customer.id,
        provider="stripe",
        external_subscription_id=f"sub_test_{uuid.uuid4().hex[:12]}",
        external_price_id="price_test",
        status="active",
        current_period_start=None,
        current_period_end=None,
        cancel_at_period_end=False,
        canceled_at=None,
        ended_at=None,
        session=db_session,
    )

    response = client.delete(
        f"/api/v1/admin/subscriptions/{sub.id}/", headers=admin_headers
    )
    assert response.status_code == 409
