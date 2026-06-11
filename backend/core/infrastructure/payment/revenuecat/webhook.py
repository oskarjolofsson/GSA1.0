# core/infrastructure/payment/revenuecat/webhook.py
import hmac

from core.config import REVENUECAT_WEBHOOK_AUTH_TOKEN
from core.infrastructure.payment.revenuecat.exceptions import (
    RevenueCatWebhookVerificationError,
)
from core.services.dtos.payment_dto import RevenueCatWebhookEvent


class RevenueCatWebhookVerifier:
    """Verifies the static Authorization header RevenueCat sends with each webhook
    and unwraps the `{ "event": {...} }` envelope into a typed event.

    RevenueCat does not sign payloads (no HMAC like Stripe). Instead you configure
    a fixed Authorization header value in the dashboard and it is replayed on every
    request; we compare it in constant time against the configured secret.
    """

    def __init__(self, expected_token: str | None = None):
        # Read lazily from config when not injected so tests can monkeypatch the
        # module-level token the same way the Stripe verifier is patched.
        self._expected_token = expected_token

    def _token(self) -> str | None:
        return (
            self._expected_token
            if self._expected_token is not None
            else REVENUECAT_WEBHOOK_AUTH_TOKEN
        )

    def construct_event(
        self,
        *,
        payload: dict,
        authorization: str | None,
    ) -> RevenueCatWebhookEvent:
        expected = self._token()
        if not expected:
            # Fail closed: an unset secret must never accept unauthenticated events.
            raise RevenueCatWebhookVerificationError(
                "RevenueCat webhook auth token is not configured"
            )

        if authorization is None or not hmac.compare_digest(authorization, expected):
            raise RevenueCatWebhookVerificationError(
                "Invalid RevenueCat webhook authorization"
            )

        event = payload.get("event")
        if not isinstance(event, dict):
            raise RevenueCatWebhookVerificationError(
                "RevenueCat webhook payload is missing the event object"
            )

        event_id = event.get("id")
        event_type = event.get("type")
        if not event_id or not event_type:
            raise RevenueCatWebhookVerificationError(
                "RevenueCat webhook event is missing id or type"
            )

        timestamp_ms = event.get("event_timestamp_ms")
        event_created_at = (
            int(timestamp_ms) // 1000 if isinstance(timestamp_ms, (int, float)) else None
        )

        return RevenueCatWebhookEvent(
            event_id=str(event_id),
            event_type=str(event_type),
            data=event,
            raw=payload,
            event_created_at=event_created_at,
        )
