from datetime import datetime, timedelta, timezone

import pytest

from core.services.payment import entitlement_service
from core.infrastructure.db.repositories import billing_customer as billing_customer_repo
from core.infrastructure.db.repositories import billing_subscription as billing_subscription_repo


def test_is_subscribed_returns_false_when_user_has_no_active_subscription(db_session, test_user):
	result = entitlement_service.is_subscribed(test_user["user_id"], db_session)
	assert result is False


def test_is_subscribed_returns_true_when_user_has_active_subscription(db_session, test_user):
	billing_customer = billing_customer_repo.create_billing_customer(
		user_id=test_user["user_id"],
		customer_id="cus_entitlement_active",
		provider="revenuecat",
		session=db_session,
	)
	billing_subscription_repo.upsert_subscription(
		billing_customer_id=billing_customer.id,
		provider="revenuecat",
		external_subscription_id="sub_entitlement_active",
		external_price_id="price_entitlement_active",
		status="active",
		current_period_start=None,
		current_period_end=None,
		cancel_at_period_end=False,
		canceled_at=None,
		ended_at=None,
		session=db_session,
	)

	result = entitlement_service.is_subscribed(test_user["user_id"], db_session)
	assert result is True


def test_get_subscription_summary_returns_none_without_active_subscription(db_session, test_user):
	assert entitlement_service.get_subscription_summary(test_user["user_id"], db_session) is None


def test_get_subscription_summary_returns_period_and_cancel_fields(db_session, test_user):
	billing_customer = billing_customer_repo.create_billing_customer(
		user_id=test_user["user_id"],
		customer_id="cus_summary",
		provider="revenuecat",
		session=db_session,
	)
	# A genuinely-current subscription: started in the past, period still in the
	# future (entitlement is now period-aware, so a past period_end would not
	# entitle and the summary would be None).
	now = datetime.now(timezone.utc)
	period_start = int((now - timedelta(days=1)).timestamp())
	period_end = int((now + timedelta(days=29)).timestamp())
	canceled_at = int((now - timedelta(hours=12)).timestamp())
	billing_subscription_repo.upsert_subscription(
		billing_customer_id=billing_customer.id,
		provider="revenuecat",
		external_subscription_id="sub_summary",
		external_price_id="price_summary",
		status="active",
		current_period_start=period_start,
		current_period_end=period_end,
		cancel_at_period_end=True,
		canceled_at=canceled_at,
		ended_at=None,
		session=db_session,
	)

	summary = entitlement_service.get_subscription_summary(test_user["user_id"], db_session)
	assert summary is not None
	assert summary["status"] == "active"
	assert summary["cancel_at_period_end"] is True
	assert summary["current_period_end"] == datetime.fromtimestamp(period_end, tz=timezone.utc).isoformat()
	assert summary["canceled_at"] == datetime.fromtimestamp(canceled_at, tz=timezone.utc).isoformat()
	assert summary["ended_at"] is None


def test_is_subscribed_true_when_active_and_scheduled_to_cancel(db_session, test_user):
	# cancel_at_period_end is the provider's scheduling flag, not an access gate:
	# an active subscription scheduled to cancel must still count as subscribed.
	billing_customer = billing_customer_repo.create_billing_customer(
		user_id=test_user["user_id"],
		customer_id="cus_scheduled_cancel",
		provider="revenuecat",
		session=db_session,
	)
	billing_subscription_repo.upsert_subscription(
		billing_customer_id=billing_customer.id,
		provider="revenuecat",
		external_subscription_id="sub_scheduled_cancel",
		external_price_id="price_scheduled_cancel",
		status="active",
		current_period_start=None,
		current_period_end=None,
		cancel_at_period_end=True,
		canceled_at=None,
		ended_at=None,
		session=db_session,
	)

	assert entitlement_service.is_subscribed(test_user["user_id"], db_session) is True


def test_is_subscribed_false_when_status_canceled(db_session, test_user):
	# 'canceled' is not in ACTIVE_SUBSCRIPTION_STATUSES, so access is revoked.
	billing_customer = billing_customer_repo.create_billing_customer(
		user_id=test_user["user_id"],
		customer_id="cus_canceled_status",
		provider="revenuecat",
		session=db_session,
	)
	billing_subscription_repo.upsert_subscription(
		billing_customer_id=billing_customer.id,
		provider="revenuecat",
		external_subscription_id="sub_canceled_status",
		external_price_id="price_canceled_status",
		status="canceled",
		current_period_start=None,
		current_period_end=None,
		cancel_at_period_end=True,
		canceled_at=1_700_040_000,
		ended_at=1_700_086_400,
		session=db_session,
	)

	assert entitlement_service.is_subscribed(test_user["user_id"], db_session) is False


def _seed_sub(db_session, test_user, *, customer_id, external_id, status, period_start, period_end):
	billing_customer = billing_customer_repo.create_billing_customer(
		user_id=test_user["user_id"],
		customer_id=customer_id,
		provider="revenuecat",
		session=db_session,
	)
	billing_subscription_repo.upsert_subscription(
		billing_customer_id=billing_customer.id,
		provider="revenuecat",
		external_subscription_id=external_id,
		external_price_id="price_x",
		status=status,
		current_period_start=period_start,
		current_period_end=period_end,
		cancel_at_period_end=False,
		canceled_at=None,
		ended_at=None,
		session=db_session,
	)


def test_is_subscribed_false_when_active_but_period_expired(db_session, test_user):
	# The revenue leak: status stayed "active" (terminating webhook never landed)
	# but the paid period has passed. This must NOT entitle.
	past = datetime.now(timezone.utc) - timedelta(days=3)
	_seed_sub(db_session, test_user, customer_id="cus_expired", external_id="sub_expired",
		status="active", period_start=None, period_end=past)

	assert entitlement_service.is_subscribed(test_user["user_id"], db_session) is False


def test_is_subscribed_true_when_active_and_period_in_future(db_session, test_user):
	future = datetime.now(timezone.utc) + timedelta(days=10)
	_seed_sub(db_session, test_user, customer_id="cus_future", external_id="sub_future",
		status="active", period_start=None, period_end=future)

	assert entitlement_service.is_subscribed(test_user["user_id"], db_session) is True


def test_is_subscribed_true_when_past_due_even_if_period_expired(db_session, test_user):
	# Grace: a past_due row legitimately has a past period_end while the provider
	# retries payment. Access is kept during the retry window.
	past = datetime.now(timezone.utc) - timedelta(days=1)
	_seed_sub(db_session, test_user, customer_id="cus_grace", external_id="sub_grace",
		status="past_due", period_start=None, period_end=past)

	assert entitlement_service.is_subscribed(test_user["user_id"], db_session) is True


def test_is_subscribed_false_when_not_yet_started(db_session, test_user):
	# A future-dated start means the subscription is not active yet.
	future = datetime.now(timezone.utc) + timedelta(days=2)
	_seed_sub(db_session, test_user, customer_id="cus_notstarted", external_id="sub_notstarted",
		status="active", period_start=future, period_end=future + timedelta(days=30))

	assert entitlement_service.is_subscribed(test_user["user_id"], db_session) is False


def _subscribe(db_session, test_user, *, customer_id, external_id):
	billing_customer = billing_customer_repo.create_billing_customer(
		user_id=test_user["user_id"],
		customer_id=customer_id,
		provider="revenuecat",
		session=db_session,
	)
	billing_subscription_repo.upsert_subscription(
		billing_customer_id=billing_customer.id,
		provider="revenuecat",
		external_subscription_id=external_id,
		external_price_id="price_x",
		status="active",
		current_period_start=None,
		current_period_end=None,
		cancel_at_period_end=False,
		canceled_at=None,
		ended_at=None,
		session=db_session,
	)
	db_session.flush()


# --- require_ai_access / require_focus_capacity (T1/T8) --------------------
#
# There is no free tier any more (has_free_tier / can_access_premium_features /
# free_tier_expires_at were removed): is_subscribed is the only entitlement signal
# left, and these two FastAPI dependencies are the only gates built on it. Called
# directly here (not through the HTTP layer) since they are plain functions.

from fastapi import HTTPException

from app.dependencies.entitlement import require_ai_access, require_focus_capacity
from core.services.exceptions import FocusLimitExceeded
from core.infrastructure.db.repositories import programs as programs_repo
from core.infrastructure.db.models.Program import Program


def test_require_ai_access_blocks_unsubscribed_user(db_session, test_user):
	current_user = {"user_id": str(test_user["user_id"])}
	with pytest.raises(HTTPException) as exc_info:
		require_ai_access(current_user=current_user, db=db_session)
	assert exc_info.value.status_code == 402


def test_require_ai_access_allows_subscribed_user(db_session, test_user):
	_subscribe(db_session, test_user, customer_id="cus_ai_access", external_id="sub_ai_access")
	current_user = {"user_id": str(test_user["user_id"])}
	assert require_ai_access(current_user=current_user, db=db_session) == current_user


def test_require_focus_capacity_allows_unsubscribed_user_with_zero_active_focuses(
	db_session, test_user
):
	current_user = {"user_id": str(test_user["user_id"])}
	assert require_focus_capacity(current_user=current_user, db=db_session) == current_user


def test_require_focus_capacity_blocks_unsubscribed_user_with_one_active_focus(
	db_session, test_user
):
	db_session.add(
		Program(
			user_id=test_user["user_id"],
			title="Existing focus",
			status="active",
			area="FULL_SWING",
			slot=0,
		)
	)
	db_session.flush()

	current_user = {"user_id": str(test_user["user_id"])}
	with pytest.raises(FocusLimitExceeded):
		require_focus_capacity(current_user=current_user, db=db_session)


def test_require_focus_capacity_always_allows_subscribed_user(db_session, test_user):
	_subscribe(db_session, test_user, customer_id="cus_focus_cap", external_id="sub_focus_cap")
	db_session.add(
		Program(
			user_id=test_user["user_id"],
			title="Existing focus",
			status="active",
			area="FULL_SWING",
			slot=0,
		)
	)
	db_session.flush()

	current_user = {"user_id": str(test_user["user_id"])}
	assert require_focus_capacity(current_user=current_user, db=db_session) == current_user
