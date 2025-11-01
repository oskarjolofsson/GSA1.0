
import stripe
from services.stripe.stripeEvents import StripeEvents


class HandleSubscriptionDeleted(StripeEvents):
    
    def __init__(self, 
                 customer_id: str = None,
                 subscription_id: str = None,
                 price_id: str = None,
                 current_period_end: int = None
                 ):
        super().__init__(customer_id, subscription_id, price_id, current_period_end)
    
    def event(self):
        self.firebase_stripe_service.update_subscription_info(
            subscription_id=None,
            price_id=None,
            current_period_end=None,
            status="free"
            )
        print("Cleared subscription info for user:", self.firebase_user_id)
        return self.firebase_user_id
    
    def endSubscription(self):
        stripe.Subscription.delete(self.subscription_id, cancel_at_period_end=True)