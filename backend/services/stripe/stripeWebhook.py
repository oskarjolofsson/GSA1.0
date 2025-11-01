from services.firebase.firebase_stripe import FirebaseStripeService
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
        
        self.events_map = {
            "checkout.session.completed": self.handleCheckoutComplete,
            "customer.subscription.updated": self.handleSubscriptionUpdated,
            "customer.subscription.deleted": self.handleSubscriptionDeleted,
            "customer.subscription.created": self.handleSubscriptionCreated,
            "invoice.finalized": self.handleInvoiceFinalized,
            "invoice.payment_succeeded": self.handleInvoicePaymentSucceeded,
            "invoice.payment_failed": self.handleInvoicePaymentFailed,
            "customer.deleted": self.handleCustomerDeleted,
            "customer.updated": self.handleCustomerUpdated,
            "checkout.session.expired": self.handleCheckoutSessionExpired,
            "invoice.updated": self.handleInvoiceUpdated,
            "invoice.created": self.handleInvoiceCreated
        }
        
        self.data = self.getData()
            
        self.firebase_stripe_service = FirebaseStripeService(None)
        self.firebase_user_id = self.firebase_stripe_service.get_user_id_by_customer_id(self.data.get("customer", None))

    def handle_event(self) -> None:
        try:
            event = stripe.Webhook.construct_event(self.payload, self.sig_header, self.webhook_secret)
        except stripe.error.SignatureVerificationError:
            return "Invalid signature", 400

        event_type = event["type"]
        
        if self.events_map.get(event_type):
            self.events_map.get(event_type)()
            return "Success", 200
        else:
            print("Unhandled event type:", event_type)
            return "Unhandled event", 400


    def handleCheckoutComplete(self):
        self.firebase_stripe_service.update_subscription_info(
            subscription_id=self.data.get("subscription"),
            price_id=self.data.get("display_items", [{}])[0].get("price", {}).get("id"),
            current_period_end=stripe.Subscription.retrieve(self.data.get("subscription")).get("current_period_end"),
            status="active"
        )
        print("Updated subscription info for user:", self.firebase_user_id)
    
    def handleSubscriptionUpdated(self):
        self.firebase_stripe_service.update_subscription_info(
            subscription_id=self.data.get("subscription"),
            price_id=self.data.get("items", {}).get("data", [{}])[0].get("price", {}).get("id"),
            current_period_end=self.data.get("current_period_end"),
            status=self.data.get("status")
        )
        print("Updated subscription info for user:", self.firebase_user_id)
        
    def handleSubscriptionDeleted(self):
        self.firebase_stripe_service.update_subscription_info(
            subscription_id=None,
            price_id=None,
            current_period_end=None,
            status="free"
            )
        print("Cleared subscription info for user:", self.firebase_user_id)
        
    def handleSubscriptionCreated(self):
        self.firebase_stripe_service.update_subscription_info(
            subscription_id=self.data.get("subscription"),
            price_id=self.data.get("items", {}).get("data", [{}])[0].get("price", {}).get("id"),
            current_period_end=self.data.get("current_period_end"),
            status=self.data.get("status")
        )
        print("Created subscription info for user:", self.firebase_user_id)
    
    def handleInvoicePaymentSucceeded(self):
        print("TODO : Handle invoice.payment_succeeded event")

    def handleInvoicePaymentFailed(self):
        print("TODO : Handle invoice.payment_failed event")
        
    def handleInvoiceFinalized(self):
        print("TODO : Handle invoice.finalized event")
        
    def handleInvoiceUpdated(self):
        print("TODO : Handle invoice.updated event")
        
    def handleInvoiceCreated(self):
        print("TODO : Handle invoice.created event")

    def handleCustomerDeleted(self):
        self.firebase_stripe_service.update_subscription_info(
            subscription_id=None,
            price_id=None,
            current_period_end=None,
            status="free"
            )
        print("Cleared subscription info for deleted customer:", self.firebase_user_id)
        
    def handleCustomerUpdated(self):
        self.firebase_stripe_service.update_customer_info(
            email=self.data.get("email"),
            name=self.data.get("name"),
            phone=self.data.get("phone")
        )
        print("Updated customer info for user:", self.firebase_user_id)

    def handleCheckoutSessionExpired(self):
        print("TODO : Handle checkout.session.expired event")

    def getData(self):
        try:
            event = stripe.Webhook.construct_event(self.payload, self.sig_header, self.webhook_secret)
        except stripe.error.SignatureVerificationError:
            return "Invalid signature", 400

        return event["data"]["object"]