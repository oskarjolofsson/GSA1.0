from datetime import datetime, timezone

from core.infrastructure.db import models
from core.infrastructure.db.repositories import billing_customer as billing_customer_repo
from core.infrastructure.db.repositories import billing_subscription as billing_subscription_repo
from core.services.dtos.payment_dto import StripeWebhookEvent
from core.services.payment import billing_service


WEBHOOK_URL = "/api/v1/webhook/stripe/"


def test_webhook_checkout_session_completed_is_successful_and_idempotent(
	client,
	db_session,
	test_user,
	monkeypatch,
):
	payload = b'{"type":"checkout.session.completed"}'
	event_data = {
		"metadata": {"user_id": str(test_user["user_id"])},
		"customer": "cus_checkout_completed",
		"subscription": "sub_checkout_completed",
		"items": {
			"data": [
				{"price": {"id": "price_checkout_completed"}},
			]
		},
	}

	construct_event_mock = lambda payload, signature: StripeWebhookEvent(
		event_id="evt_checkout_completed",
		event_type="checkout.session.completed",
		data=event_data,
		raw=None,
	)
	monkeypatch.setattr(
		billing_service.webhook_verifier,
		"construct_event",
		construct_event_mock,
	)

	response_one = client.post(
		WEBHOOK_URL,
		content=payload,
		headers={"Stripe-Signature": "sig_checkout_completed"},
	)
	response_two = client.post(
		WEBHOOK_URL,
		content=payload,
		headers={"Stripe-Signature": "sig_checkout_completed"},
	)

	assert response_one.status_code == 200
	assert response_two.status_code == 200
	assert response_one.json() == {"received": True}

	billing_customer = billing_customer_repo.get_customer_by_user_id(test_user["user_id"], db_session)
	assert billing_customer is not None
	assert billing_customer.customer_id == "cus_checkout_completed"

	subscription = billing_subscription_repo.get_subscription_by_stripe_subscription_id(
		"sub_checkout_completed",
		db_session,
	)
	assert subscription is not None
	assert subscription.billing_customer_id == billing_customer.id
	assert subscription.stripe_price_id == "price_checkout_completed"
	assert subscription.stripe_status == "active"

	duplicate_count = (
		db_session.query(models.BillingSubscription)
		.filter(models.BillingSubscription.stripe_subscription_id == "sub_checkout_completed")
		.count()
	)
	assert duplicate_count == 1


def test_webhook_subscription_created_creates_subscription_with_expected_fields(
	client,
	db_session,
	test_user,
	monkeypatch,
):
	billing_customer = billing_customer_repo.create_billing_customer(
		user_id=test_user["user_id"],
		customer_id="cus_subscription_created",
		session=db_session,
	)
	period_start = 1_710_000_000
	period_end = 1_710_086_400

	monkeypatch.setattr(
		billing_service.webhook_verifier,
		"construct_event",
		lambda payload, signature: StripeWebhookEvent(
			event_id="evt_subscription_created",
			event_type="customer.subscription.created",
			data={
				"id": "sub_created_123",
				"customer": "cus_subscription_created",
				"status": "trialing",
				"current_period_start": period_start,
				"current_period_end": period_end,
				"cancel_at_period_end": False,
				"canceled_at": None,
				"ended_at": None,
				"items": {
					"data": [
						{"price": {"id": "price_created_123"}},
					]
				},
			},
			raw=None,
		),
	)

	response = client.post(
		WEBHOOK_URL,
		content=b'{"type":"customer.subscription.created"}',
		headers={"Stripe-Signature": "sig_subscription_created"},
	)

	assert response.status_code == 200

	subscription = billing_subscription_repo.get_subscription_by_stripe_subscription_id(
		"sub_created_123",
		db_session,
	)
	assert subscription is not None
	assert subscription.billing_customer_id == billing_customer.id
	assert subscription.stripe_status == "trialing"
	assert subscription.stripe_price_id == "price_created_123"
	assert subscription.current_period_start == datetime.fromtimestamp(period_start, tz=timezone.utc)
	assert subscription.current_period_end == datetime.fromtimestamp(period_end, tz=timezone.utc)
	assert subscription.cancel_at_period_end is False


def test_webhook_subscription_updated_updates_existing_local_subscription(
	client,
	db_session,
	test_user,
	monkeypatch,
):
	billing_customer = billing_customer_repo.create_billing_customer(
		user_id=test_user["user_id"],
		customer_id="cus_subscription_updated",
		session=db_session,
	)
	billing_subscription_repo.upsert_subscription_from_stripe(
		billing_customer_id=billing_customer.id,
		stripe_subscription_id="sub_updated_123",
		stripe_price_id="price_old",
		stripe_status="active",
		current_period_start=1_700_000_000,
		current_period_end=1_700_086_400,
		cancel_at_period_end=False,
		canceled_at=None,
		ended_at=None,
		session=db_session,
	)

	new_period_start = 1_720_000_000
	new_period_end = 1_720_086_400
	canceled_at = 1_720_040_000

	monkeypatch.setattr(
		billing_service.webhook_verifier,
		"construct_event",
		lambda payload, signature: StripeWebhookEvent(
			event_id="evt_subscription_updated",
			event_type="customer.subscription.updated",
			data={
				"id": "sub_updated_123",
				"customer": "cus_subscription_updated",
				"status": "past_due",
				"current_period_start": new_period_start,
				"current_period_end": new_period_end,
				"cancel_at_period_end": True,
				"canceled_at": canceled_at,
				"ended_at": None,
				"items": {
					"data": [
						{"price": {"id": "price_updated"}},
					]
				},
			},
			raw=None,
		),
	)

	response = client.post(
		WEBHOOK_URL,
		content=b'{"type":"customer.subscription.updated"}',
		headers={"Stripe-Signature": "sig_subscription_updated"},
	)

	assert response.status_code == 200

	subscription = billing_subscription_repo.get_subscription_by_stripe_subscription_id(
		"sub_updated_123",
		db_session,
	)
	assert subscription is not None
	assert subscription.stripe_status == "past_due"
	assert subscription.stripe_price_id == "price_updated"
	assert subscription.current_period_start == datetime.fromtimestamp(new_period_start, tz=timezone.utc)
	assert subscription.current_period_end == datetime.fromtimestamp(new_period_end, tz=timezone.utc)
	assert subscription.cancel_at_period_end is True
	assert subscription.canceled_at == datetime.fromtimestamp(canceled_at, tz=timezone.utc)


def test_webhook_subscription_deleted_marks_subscription_ended_and_not_active(
	client,
	db_session,
	test_user,
	monkeypatch,
):
	billing_customer = billing_customer_repo.create_billing_customer(
		user_id=test_user["user_id"],
		customer_id="cus_subscription_deleted",
		session=db_session,
	)
	billing_subscription_repo.upsert_subscription_from_stripe(
		billing_customer_id=billing_customer.id,
		stripe_subscription_id="sub_deleted_123",
		stripe_price_id="price_before_delete",
		stripe_status="active",
		current_period_start=1_700_000_000,
		current_period_end=1_700_086_400,
		cancel_at_period_end=False,
		canceled_at=None,
		ended_at=None,
		session=db_session,
	)

	canceled_at = 1_730_000_000
	ended_at = 1_730_000_500

	monkeypatch.setattr(
		billing_service.webhook_verifier,
		"construct_event",
		lambda payload, signature: StripeWebhookEvent(
			event_id="evt_subscription_deleted",
			event_type="customer.subscription.deleted",
			data={
				"id": "sub_deleted_123",
				"customer": "cus_subscription_deleted",
				"status": "canceled",
				"current_period_start": 1_729_900_000,
				"current_period_end": 1_729_986_400,
				"cancel_at_period_end": True,
				"canceled_at": canceled_at,
				"ended_at": ended_at,
				"items": {
					"data": [
						{"price": {"id": "price_deleted"}},
					]
				},
			},
			raw=None,
		),
	)

	response = client.post(
		WEBHOOK_URL,
		content=b'{"type":"customer.subscription.deleted"}',
		headers={"Stripe-Signature": "sig_subscription_deleted"},
	)

	assert response.status_code == 200

	subscription = billing_subscription_repo.get_subscription_by_stripe_subscription_id(
		"sub_deleted_123",
		db_session,
	)
	assert subscription is not None
	assert subscription.stripe_status == "canceled"
	assert subscription.cancel_at_period_end is True
	assert subscription.canceled_at == datetime.fromtimestamp(canceled_at, tz=timezone.utc)
	assert subscription.ended_at == datetime.fromtimestamp(ended_at, tz=timezone.utc)

	active_subscription = billing_subscription_repo.get_active_subscriptions_for_user(
		test_user["user_id"],
		db_session,
	)
	assert active_subscription is None
