import asyncio
from types import SimpleNamespace
from unittest.mock import Mock
import pytest

from core.services import exceptions
from core.services.payment import billing_service
from core.infrastructure.payment.stripe.exceptions import StripeInfrastructureError


def test_start_subscription_checkout_creates_billing_customer_when_missing(
    monkeypatch,
    db_session,
    test_user,
):
    monkeypatch.setattr(billing_service, "PRICE_ID", "price_test_123")

    mock_checkout_session = SimpleNamespace(
        url="https://checkout.stripe.com/test-session",
        customer_id="test_customer_id",
    )
    create_checkout_mock = Mock(return_value=mock_checkout_session)
    monkeypatch.setattr(
        billing_service.stripe_gateway,
        "create_subscription_checkout_session",
        create_checkout_mock,
    )

    checkout_url = asyncio.run(billing_service.start_subscription_checkout(test_user["user_id"], db_session))

    new_customer = billing_service.billing_customer_repo.get_customer_by_user_id(test_user["user_id"], db_session)
    assert new_customer is not None
    assert new_customer.customer_id == "test_customer_id"
    assert checkout_url == "https://checkout.stripe.com/test-session"
    create_checkout_mock.assert_called_once()


def test_start_subscription_checkout_reuses_existing_billing_customer(
    monkeypatch,
    db_session,
    test_user,
):
    monkeypatch.setattr(billing_service, "PRICE_ID", "price_test_123")

    existing_customer = billing_service.billing_customer_repo.create_billing_customer(
        user_id=test_user["user_id"],
        customer_id="cus_existing_123",
        session=db_session,
    )

    create_customer_mock = Mock(wraps=billing_service.billing_customer_repo.create_billing_customer)
    create_checkout_mock = Mock(
        return_value=SimpleNamespace(
            url="https://checkout.stripe.com/reused-customer",
            customer_id="cus_existing_123",
        )
    )
    monkeypatch.setattr(
        billing_service.billing_customer_repo,
        "create_billing_customer",
        create_customer_mock,
    )
    monkeypatch.setattr(
        billing_service.stripe_gateway,
        "create_subscription_checkout_session",
        create_checkout_mock,
    )

    checkout_url = asyncio.run(billing_service.start_subscription_checkout(test_user["user_id"], db_session))

    assert checkout_url == "https://checkout.stripe.com/reused-customer"
    create_customer_mock.assert_not_called()
    create_checkout_mock.assert_called_once_with(
        user_id=str(test_user["user_id"]),
        email=test_user["email"],
        stripe_price_id="price_test_123",
        stripe_customer_id=existing_customer.customer_id,
    )


def test_start_subscription_checkout_raises_conflict_for_active_subscription(
    monkeypatch,
    db_session,
    test_user,
):
    monkeypatch.setattr(billing_service, "PRICE_ID", "price_test_123")

    existing_customer = billing_service.billing_customer_repo.create_billing_customer(
        user_id=test_user["user_id"],
        customer_id="cus_conflict_123",
        session=db_session,
    )

    active_subscription = SimpleNamespace(id="sub_active", stripe_status="active")
    create_checkout_mock = Mock()

    monkeypatch.setattr(
        billing_service.billing_subscription_repo,
        "get_active_subscriptions",
        Mock(return_value=active_subscription),
    )
    monkeypatch.setattr(
        billing_service.stripe_gateway,
        "create_subscription_checkout_session",
        create_checkout_mock,
    )

    with pytest.raises(exceptions.ConflictException):
        asyncio.run(billing_service.start_subscription_checkout(test_user["user_id"], db_session))

    create_checkout_mock.assert_not_called()
    assert existing_customer.customer_id == "cus_conflict_123"


def test_start_subscription_checkout_calls_stripe_and_returns_checkout_url(
    monkeypatch,
    db_session,
    test_user,
):
    monkeypatch.setattr(billing_service, "PRICE_ID", "price_test_123")

    create_checkout_mock = Mock(
        return_value=SimpleNamespace(
            url="https://checkout.stripe.com/ok",
            customer_id="cus_new_ok",
        )
    )
    monkeypatch.setattr(
        billing_service.stripe_gateway,
        "create_subscription_checkout_session",
        create_checkout_mock,
    )

    checkout_url = asyncio.run(billing_service.start_subscription_checkout(test_user["user_id"], db_session))

    assert checkout_url == "https://checkout.stripe.com/ok"
    create_checkout_mock.assert_called_once_with(
        user_id=str(test_user["user_id"]),
        email=test_user["email"],
        stripe_price_id="price_test_123",
        stripe_customer_id=None,
    )


def test_start_subscription_checkout_raises_stripe_exception_when_url_missing(
    monkeypatch,
    db_session,
    test_user,
):
    monkeypatch.setattr(billing_service, "PRICE_ID", "price_test_123")
    monkeypatch.setattr(
        billing_service.stripe_gateway,
        "create_subscription_checkout_session",
        Mock(return_value=SimpleNamespace(url=None, customer_id="cus_no_url")),
    )

    with pytest.raises(StripeInfrastructureError):
        asyncio.run(billing_service.start_subscription_checkout(test_user["user_id"], db_session))


def test_start_subscription_checkout_raises_stripe_exception_when_stripe_call_fails(
    monkeypatch,
    db_session,
    test_user,
):
    monkeypatch.setattr(billing_service, "PRICE_ID", "price_test_123")
    monkeypatch.setattr(
        billing_service.stripe_gateway,
        "create_subscription_checkout_session",
        Mock(side_effect=StripeInfrastructureError("Failed to create checkout session")),
    )

    with pytest.raises(StripeInfrastructureError):
        asyncio.run(billing_service.start_subscription_checkout(test_user["user_id"], db_session))



def test_is_subscribed_with_nonexistent_user(db_session):
    non_existent_user_id = "00000000-0000-0000-0000-000000000000"

    with pytest.raises(exceptions.NotFoundException):
        asyncio.run(
            billing_service.start_subscription_checkout(non_existent_user_id, db_session)
        )


