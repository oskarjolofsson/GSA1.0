from datetime import datetime, timedelta, timezone

from core.services.payment import entitlement_service
from core.infrastructure.db.repositories import billing_customer as billing_customer_repo
from core.infrastructure.db.repositories import billing_subscription as billing_subscription_repo
from core.infrastructure.db.repositories import profiles as profiles_repo


def test_is_subscribed_returns_false_when_user_has_no_active_subscription(db_session, test_user):
	result = entitlement_service.is_subscribed(test_user["user_id"], db_session)
	assert result is False


def test_is_subscribed_returns_true_when_user_has_active_subscription(db_session, test_user):
	billing_customer = billing_customer_repo.create_billing_customer(
		user_id=test_user["user_id"],
		customer_id="cus_entitlement_active",
		session=db_session,
	)
	billing_subscription_repo.upsert_subscription(
		billing_customer_id=billing_customer.id,
		provider="stripe",
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
		session=db_session,
	)
	period_end = 1_720_086_400
	billing_subscription_repo.upsert_subscription(
		billing_customer_id=billing_customer.id,
		provider="stripe",
		external_subscription_id="sub_summary",
		external_price_id="price_summary",
		status="active",
		current_period_start=1_720_000_000,
		current_period_end=period_end,
		cancel_at_period_end=True,
		canceled_at=1_720_040_000,
		ended_at=None,
		session=db_session,
	)

	summary = entitlement_service.get_subscription_summary(test_user["user_id"], db_session)
	assert summary is not None
	assert summary["status"] == "active"
	assert summary["cancel_at_period_end"] is True
	assert summary["current_period_end"] == datetime.fromtimestamp(period_end, tz=timezone.utc).isoformat()
	assert summary["canceled_at"] == datetime.fromtimestamp(1_720_040_000, tz=timezone.utc).isoformat()
	assert summary["ended_at"] is None


def test_is_subscribed_true_when_active_and_scheduled_to_cancel(db_session, test_user):
	# cancel_at_period_end is Stripe's scheduling flag, not an access gate:
	# an active subscription scheduled to cancel must still count as subscribed.
	billing_customer = billing_customer_repo.create_billing_customer(
		user_id=test_user["user_id"],
		customer_id="cus_scheduled_cancel",
		session=db_session,
	)
	billing_subscription_repo.upsert_subscription(
		billing_customer_id=billing_customer.id,
		provider="stripe",
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
		session=db_session,
	)
	billing_subscription_repo.upsert_subscription(
		billing_customer_id=billing_customer.id,
		provider="stripe",
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


def test_has_free_tier_returns_true_for_recent_profile(db_session, test_user):
	profile = profiles_repo.get_profile_by_id(test_user["user_id"], db_session)
	assert profile is not None
	profile.created_at = datetime.now(timezone.utc) - timedelta(days=2)
	db_session.flush()

	result = entitlement_service.has_free_tier(test_user["user_id"], db_session)
	assert result is True


def test_has_free_tier_returns_false_for_old_profile(db_session, test_user):
	profile = profiles_repo.get_profile_by_id(test_user["user_id"], db_session)
	assert profile is not None
	profile.created_at = datetime.now(timezone.utc) - timedelta(days=15)
	db_session.flush()

	result = entitlement_service.has_free_tier(test_user["user_id"], db_session)
	assert result is not True


def test_can_access_premium_features_returns_true_when_free_tier_is_true(db_session, test_user):
	profile = profiles_repo.get_profile_by_id(test_user["user_id"], db_session)
	assert profile is not None
	profile.created_at = datetime.now(timezone.utc) - timedelta(days=1)
	db_session.flush()

	result = entitlement_service.can_access_premium_features(test_user["user_id"], db_session)
	assert result is True


def test_can_access_premium_features_returns_true_when_subscribed(db_session, test_user):
	profile = profiles_repo.get_profile_by_id(test_user["user_id"], db_session)
	assert profile is not None
	profile.created_at = datetime.now(timezone.utc) - timedelta(days=30)

	billing_customer = billing_customer_repo.create_billing_customer(
		user_id=test_user["user_id"],
		customer_id="cus_entitlement_combo",
		session=db_session,
	)
	billing_subscription_repo.upsert_subscription(
		billing_customer_id=billing_customer.id,
		provider="stripe",
		external_subscription_id="sub_entitlement_combo",
		external_price_id="price_entitlement_combo",
		status="active",
		current_period_start=None,
		current_period_end=None,
		cancel_at_period_end=False,
		canceled_at=None,
		ended_at=None,
		session=db_session,
	)
	db_session.flush()

	result = entitlement_service.can_access_premium_features(test_user["user_id"], db_session)
	assert result is True


def test_can_access_premium_features_returns_false_when_not_subscribed_and_no_free_tier(
	db_session,
	test_user,
):
	profile = profiles_repo.get_profile_by_id(test_user["user_id"], db_session)
	assert profile is not None
	profile.created_at = datetime.now(timezone.utc) - timedelta(days=30)
	db_session.flush()

	result = entitlement_service.can_access_premium_features(test_user["user_id"], db_session)
	assert result is not True
