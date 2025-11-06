from services.firebase.firebase_stripe import FirebaseStripeService
from services.stripe.stripe import StripeService
import stripe
import time

class StripeInvoiceService(StripeService):
    def __init__(self, uid: str, new_price_id: str):
        self.uid = uid
        self.new_price_id = new_price_id

    def get_upcoming_invoice_price(self) -> float:
        # Get the customer_id
        customer = FirebaseStripeService(firebase_user_id=self.uid).db_get_user()
        customer_id = customer.get('stripe_customer_id')
        subscription_id = customer.get('stripe_subscription_id')
        
        subscription = stripe.Subscription.retrieve(subscription_id)
        subscription_item_id = subscription["items"]["data"][0]["id"]
       
    
        upcoming = stripe.Invoice.create_preview(
            customer=customer_id,
            subscription=subscription_id,
            subscription_details={
                "items": [{
                    "id": subscription_item_id,
                    "price": self.new_price_id,
                }],
                "proration_behavior": "create_prorations",
                "proration_date": int(time.time()),
                "billing_cycle_anchor": "unchanged",
            }
        )

        return upcoming.get("amount_due", 0) / 100.0