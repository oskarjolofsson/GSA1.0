from core.services.payment import billing_service
from core.infrastructure.db.repositories import billing_customer as billing_customer_repo
from core.infrastructure.db.repositories import billing_subscription as billing_subscription_repo
from core.infrastructure.db.repositories import profiles as profiles_repo
from unittest.mock import Mock


def test_start_checkout_success(client, test_user, auth_headers, db_session):
    response = client.post("/api/v1/billing/checkout-session/", headers=auth_headers)
    print(response.json())
    assert response.status_code == 200
    data = response.json()
    assert "checkout_url" in data
    assert data["checkout_url"].startswith("https://checkout.stripe.com/")
    
    
def test_start_checkout_when_already_subscribed(
    client,
    test_user,
    auth_headers,
    db_session,
    monkeypatch,
):
    billing_customer = billing_customer_repo.create_billing_customer(
        user_id=test_user["user_id"],
        customer_id="cus_already_subscribed",
        session=db_session,
    )
    billing_subscription_repo.upsert_subscription_from_stripe(
        billing_customer_id=billing_customer.id,
        stripe_subscription_id="sub_already_active",
        stripe_price_id="price_test",
        stripe_status="active",
        current_period_start=None,
        current_period_end=None,
        cancel_at_period_end=False,
        canceled_at=None,
        ended_at=None,
        session=db_session,
    )

    create_checkout_mock = Mock()
    monkeypatch.setattr(
        billing_service.stripe_gateway,
        "create_subscription_checkout_session",
        create_checkout_mock,
    )

    response = client.post("/api/v1/billing/checkout-session/", headers=auth_headers)

    assert response.status_code == 409
    assert response.json()["detail"] == "User already has an active subscription"
    create_checkout_mock.assert_not_called()


def test_start_checkout_with_invalid_user_mapping_returns_not_found(
    client,
    test_user,
    auth_headers,
    db_session,
    monkeypatch,
):
    profile = profiles_repo.get_profile_by_id(test_user["user_id"], db_session)
    assert profile is not None
    db_session.delete(profile)
    db_session.flush()

    create_checkout_mock = Mock()
    monkeypatch.setattr(
        billing_service.stripe_gateway,
        "create_subscription_checkout_session",
        create_checkout_mock,
    )

    response = client.post("/api/v1/billing/checkout-session/", headers=auth_headers)

    assert response.status_code == 404
    assert response.json()["detail"] == f"User with id {test_user['user_id']} not found"
    create_checkout_mock.assert_not_called()
    
    
    