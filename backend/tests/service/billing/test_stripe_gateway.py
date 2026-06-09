"""Tests for StripeGateway param building.

Other billing tests mock create_subscription_checkout_session entirely, so the
params dict handed to the Stripe SDK is never exercised. These mock only the SDK
call (self.client.v1.checkout.sessions.create) and assert the params, guarding
the "you may only specify one of customer / customer_email" class of bug.
"""

from types import SimpleNamespace
from unittest.mock import Mock

import pytest

from core.infrastructure.payment.stripe.gateway import StripeGateway


def _make_gateway() -> tuple[StripeGateway, Mock]:
    create_mock = Mock(
        return_value=SimpleNamespace(
            id="cs_test_123",
            url="https://checkout.stripe.com/c/pay/cs_test_123",
            customer="cus_123",
            subscription="sub_123",
        )
    )
    client = SimpleNamespace(
        v1=SimpleNamespace(
            checkout=SimpleNamespace(
                sessions=SimpleNamespace(create=create_mock)
            )
        )
    )
    return StripeGateway(client=client), create_mock


def test_checkout_uses_customer_email_for_new_customer():
    gateway, create_mock = _make_gateway()

    gateway.create_subscription_checkout_session(
        user_id="user-1",
        email="player@example.com",
        stripe_price_id="price_x",
        stripe_customer_id=None,
    )

    params = create_mock.call_args.args[0]
    assert params["customer_email"] == "player@example.com"
    assert "customer" not in params


def test_checkout_uses_customer_id_for_returning_customer():
    gateway, create_mock = _make_gateway()

    gateway.create_subscription_checkout_session(
        user_id="user-1",
        email="player@example.com",
        stripe_price_id="price_x",
        stripe_customer_id="cus_existing",
    )

    params = create_mock.call_args.args[0]
    assert params["customer"] == "cus_existing"
    assert "customer_email" not in params


@pytest.mark.parametrize("stripe_customer_id", [None, "cus_existing"])
def test_checkout_never_sends_both_customer_and_customer_email(stripe_customer_id):
    # Stripe rejects specifying both; assert it's impossible regardless of input.
    gateway, create_mock = _make_gateway()

    gateway.create_subscription_checkout_session(
        user_id="user-1",
        email="player@example.com",
        stripe_price_id="price_x",
        stripe_customer_id=stripe_customer_id,
    )

    params = create_mock.call_args.args[0]
    assert not ("customer" in params and "customer_email" in params)
