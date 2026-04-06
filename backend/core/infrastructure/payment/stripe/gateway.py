# app/infrastructure/stripe/gateway.py
from stripe import StripeClient

from core.infrastructure.payment.stripe.client import stripe_client
from core.infrastructure.payment.stripe.exceptions import StripeInfrastructureError
from core.services.dtos.payment_dto import (
    StripeCheckoutSessionResult,
    StripePortalSessionResult,
)
from core.config import FRONTEND_URL


class StripeGateway:
    def __init__(self, client: StripeClient = stripe_client):
        self.client = client

    def create_subscription_checkout_session(
        self,
        *,
        user_id: str,
        email: str,
        stripe_price_id: str,
        stripe_customer_id: str | None = None,
    ) -> StripeCheckoutSessionResult:
        try:
            params = {
                "mode": "subscription",
                "line_items": [
                    {
                        "price": stripe_price_id,
                        "quantity": 1,
                    }
                ],
                "success_url": (
                    f"{FRONTEND_URL}/billing/success"
                    "?session_id={CHECKOUT_SESSION_ID}"
                ),
                "cancel_url": f"{FRONTEND_URL}/pricing",
                "metadata": {
                    "user_id": user_id,
                },
                "subscription_data": {
                    "metadata": {
                        "user_id": user_id,
                    }
                },
            }

            if stripe_customer_id:
                params["customer"] = stripe_customer_id
                
            params["customer_email"] = email

            session = self.client.v1.checkout.sessions.create(params)

            return StripeCheckoutSessionResult(
                id=session.id,
                url=session.url,
                customer_id=getattr(session, "customer", None),
                subscription_id=getattr(session, "subscription", None),
                raw=session,
            )
        except Exception as exc:
            raise StripeInfrastructureError("Failed to create checkout session") from exc

    def create_billing_portal_session(
        self,
        *,
        stripe_customer_id: str,
    ) -> StripePortalSessionResult:
        try:
            session = self.client.v1.billing_portal.sessions.create(
                {
                    "customer": stripe_customer_id,
                    "return_url": f"{FRONTEND_URL}/dashboard/settings",
                }
            )
            return StripePortalSessionResult(
                url=session.url,
                raw=session,
            )
        except Exception as exc:
            raise StripeInfrastructureError("Failed to create billing portal session") from exc

    def retrieve_checkout_session(self, session_id: str):
        try:
            return self.client.v1.checkout.sessions.retrieve(session_id)
        except Exception as exc:
            raise StripeInfrastructureError("Failed to retrieve checkout session") from exc