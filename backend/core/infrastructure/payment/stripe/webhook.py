# app/infrastructure/stripe/webhook.py
from stripe import StripeClient

from core.config import STRIPE_WEBHOOK_SECRET
from core.infrastructure.payment.stripe.client import stripe_client
from core.infrastructure.payment.stripe.exceptions import StripeWebhookVerificationError
from core.services.dtos.payment_dto import StripeWebhookEvent


class StripeWebhookVerifier:
    def __init__(self, client: StripeClient = stripe_client):
        self.client = client

    def construct_event(
        self,
        *,
        payload: bytes,
        signature: str,
    ) -> StripeWebhookEvent:
        try:
            event = self.client.webhooks.construct_event(
                payload=payload,
                sig_header=signature,
                secret=STRIPE_WEBHOOK_SECRET,
            )

            return StripeWebhookEvent(
                event_id=event.id,
                event_type=event.type,
                data=event.data.object.to_dict(),
                raw=event,
            )
        except Exception as exc:
            raise StripeWebhookVerificationError(
                "Invalid Stripe webhook signature"
            ) from exc