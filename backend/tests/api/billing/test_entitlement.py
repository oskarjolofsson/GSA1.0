from datetime import datetime, timedelta

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
	billing_subscription_repo.upsert_subscription_from_stripe(
		billing_customer_id=billing_customer.id,
		stripe_subscription_id="sub_entitlement_active",
		stripe_price_id="price_entitlement_active",
		stripe_status="active",
		current_period_start=None,
		current_period_end=None,
		cancel_at_period_end=False,
		canceled_at=None,
		ended_at=None,
		session=db_session,
	)

	result = entitlement_service.is_subscribed(test_user["user_id"], db_session)
	assert result is True


def test_has_free_tier_returns_true_for_recent_profile(db_session, test_user):
	profile = profiles_repo.get_profile_by_id(test_user["user_id"], db_session)
	assert profile is not None
	profile.created_at = datetime.utcnow() - timedelta(days=2)
	db_session.flush()

	result = entitlement_service.has_free_tier(test_user["user_id"], db_session)
	assert result is True


def test_has_free_tier_returns_false_for_old_profile(db_session, test_user):
	profile = profiles_repo.get_profile_by_id(test_user["user_id"], db_session)
	assert profile is not None
	profile.created_at = datetime.utcnow() - timedelta(days=15)
	db_session.flush()

	result = entitlement_service.has_free_tier(test_user["user_id"], db_session)
	assert result is not True


def test_can_access_premium_features_returns_true_when_free_tier_is_true(db_session, test_user):
	profile = profiles_repo.get_profile_by_id(test_user["user_id"], db_session)
	assert profile is not None
	profile.created_at = datetime.utcnow() - timedelta(days=1)
	db_session.flush()

	result = entitlement_service.can_access_premium_features(test_user["user_id"], db_session)
	assert result is True


def test_can_access_premium_features_returns_true_when_subscribed(db_session, test_user):
	profile = profiles_repo.get_profile_by_id(test_user["user_id"], db_session)
	assert profile is not None
	profile.created_at = datetime.utcnow() - timedelta(days=30)

	billing_customer = billing_customer_repo.create_billing_customer(
		user_id=test_user["user_id"],
		customer_id="cus_entitlement_combo",
		session=db_session,
	)
	billing_subscription_repo.upsert_subscription_from_stripe(
		billing_customer_id=billing_customer.id,
		stripe_subscription_id="sub_entitlement_combo",
		stripe_price_id="price_entitlement_combo",
		stripe_status="active",
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
	profile.created_at = datetime.utcnow() - timedelta(days=30)
	db_session.flush()

	result = entitlement_service.can_access_premium_features(test_user["user_id"], db_session)
	assert result is not True
