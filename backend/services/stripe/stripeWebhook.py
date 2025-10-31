from services.stripe.stripe import StripeService
import stripe
import os
from dotenv import load_dotenv

from services.stripe.handleCheckoutComplete import HandleCheckoutComplete
from services.stripe.handleSubscriptionDeleted import HandleSubscriptionDeleted
from services.stripe.handleSubscriptionUpdated import HandleSubscriptionUpdated

class StripeWebhookService(StripeService):
    
    def __init__(self, sig_header: str, payload: bytes):
        super().__init__()
        self.sig_header = sig_header
        self.payload = payload

        load_dotenv()
        self.webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    def handle_event(self) -> None:
        try:
            event = stripe.Webhook.construct_event(self.payload, self.sig_header, self.webhook_secret)
        except stripe.error.SignatureVerificationError:
            return "Invalid signature", 400

        event_type = event["type"]
        data = event["data"]["object"]
        
        # Get correct event to handle
        event_handler: StripeService = self.get_event(event_type, data)
        if event_handler:
            event_handler.execute()
            return "Success", 200
        else:
            return "Unhandled event", 400

    def get_event(self, event_type: str, data: dict) -> StripeService | None:

        if event_type == "checkout.session.completed":
            return HandleCheckoutComplete(
                customer_id=data.get("customer"),
                subscription_id=data.get("subscription"),
                price_id=data.get("display_items", [{}])[0].get("price", {}).get("id"),
                current_period_end=stripe.Subscription.retrieve(data.get("subscription")).get("current_period_end")
            )
        elif event_type == "customer.subscription.updated":
            return HandleSubscriptionUpdated(
                customer_id=data.get("customer"),
                subscription_id=data.get("id"),
                price_id=data.get("items", {}).get("data", [{}])[0].get("price", {}).get("id"),
                current_period_end=data.get("current_period_end"),
                status=data.get("status")
            )
        elif event_type == "customer.subscription.deleted":
            return HandleSubscriptionDeleted(
                customer_id=data.get("customer"),
                subscription_id=data.get("id")
            )
        else:
            raise NotImplementedError(f"Unhandled event type: {event_type}")
