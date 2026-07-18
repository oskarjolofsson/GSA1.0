"""Service-level tests for admin_subscription_service.

Exercises the grant/revoke/list/search logic directly against the rolled-back
db_session, without going through HTTP. `test_user` gives a real profile row.
"""

import uuid
from datetime import datetime, timedelta, timezone

import pytest

from core.services import admin_subscription_service
from core.services import exceptions
from core.services.payment import entitlement_service
from core.infrastructure.db.repositories import billing_customer as billing_customer_repo
from core.infrastructure.db.repositories import billing_subscription as billing_subscription_repo


def test_grant_then_list_and_revoke(test_user, db_session):
    user_id = test_user["user_id"]

    subscriber = admin_subscription_service.grant_manual_subscription(user_id, db_session)
    assert subscriber.provider == "manual"
    assert entitlement_service.is_subscribed(user_id, db_session) is True

    page = admin_subscription_service.list_subscribers(db_session, limit=10, offset=0)
    assert page.total >= 1
    assert any(item.user_id == user_id for item in page.items)

    admin_subscription_service.revoke_manual_subscription(
        subscriber.subscription_id, db_session
    )
    assert entitlement_service.is_subscribed(user_id, db_session) is False


def test_grant_duplicate_raises_conflict(test_user, db_session):
    admin_subscription_service.grant_manual_subscription(test_user["user_id"], db_session)
    with pytest.raises(exceptions.ConflictException):
        admin_subscription_service.grant_manual_subscription(test_user["user_id"], db_session)


def test_grant_unknown_user_raises_not_found(db_session):
    with pytest.raises(exceptions.NotFoundException):
        admin_subscription_service.grant_manual_subscription(uuid.uuid4(), db_session)


def test_revoke_unknown_raises_not_found(db_session):
    with pytest.raises(exceptions.NotFoundException):
        admin_subscription_service.revoke_manual_subscription(uuid.uuid4(), db_session)


def test_search_blank_query_returns_empty(db_session):
    assert admin_subscription_service.search_profiles(db_session, "   ", limit=10) == []


def test_list_pagination_mechanics(test_user, db_session):
    # With one granted subscriber, offset past the end yields no items but a
    # stable total, and limit is echoed back.
    admin_subscription_service.grant_manual_subscription(test_user["user_id"], db_session)

    first = admin_subscription_service.list_subscribers(db_session, limit=1, offset=0)
    assert first.limit == 1
    assert len(first.items) <= 1

    total = first.total
    past_end = admin_subscription_service.list_subscribers(
        db_session, limit=1, offset=total
    )
    assert past_end.items == []
    assert past_end.total == total


def test_list_excludes_expired_sub(test_user, db_session):
    # Seed a period-expired (webhook-stuck) active sub — it must not appear in
    # the subscriber list nor inflate the count.
    customer = billing_customer_repo.create_billing_customer(
        user_id=test_user["user_id"],
        customer_id=f"cus_test_{uuid.uuid4().hex[:12]}",
        provider="stripe",
        session=db_session,
    )
    billing_subscription_repo.upsert_subscription(
        billing_customer_id=customer.id,
        provider="stripe",
        external_subscription_id=f"sub_test_{uuid.uuid4().hex[:12]}",
        external_price_id="price_test",
        status="active",
        current_period_start=None,
        current_period_end=datetime.now(timezone.utc) - timedelta(days=3),
        cancel_at_period_end=False,
        canceled_at=None,
        ended_at=None,
        session=db_session,
    )

    page = admin_subscription_service.list_subscribers(db_session, limit=1000, offset=0)
    assert all(item.user_id != test_user["user_id"] for item in page.items)


def test_count_matches_list(test_user, db_session):
    admin_subscription_service.grant_manual_subscription(test_user["user_id"], db_session)
    count = billing_subscription_repo.count_valid_subscriptions(db_session)
    rows = billing_subscription_repo.list_valid_subscriptions_with_profiles(
        db_session, limit=1000, offset=0
    )
    assert count == len(rows)
