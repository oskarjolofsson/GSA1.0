# app/infrastructure/stripe/webhook.py
import stripe
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
            event = stripe.Webhook.construct_event(
                payload=payload,
                sig_header=signature,
                secret=STRIPE_WEBHOOK_SECRET,
            )
        except (stripe.SignatureVerificationError, ValueError) as exc:
            # Only an invalid signature or unparseable payload is a verification
            # failure. Any other exception (e.g. an SDK API misuse) is a real bug
            # and must not be disguised as a signature error — let it propagate.
            raise StripeWebhookVerificationError(
                "Invalid Stripe webhook signature"
            ) from exc

        return StripeWebhookEvent(
            event_id=event.id,
            event_type=event.type,
            data=event.data.object.to_dict(),
            raw=event,
            event_created_at=getattr(event, "created", None),
        )