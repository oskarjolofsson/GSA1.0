
import stripe
from services.stripe.stripeEvents import StripeEvents


class HandleCheckoutComplete(StripeEvents):
    
    def __init__(self, 
                 customer_id: str,
                 subscription_id: str,
                 price_id: str = None,
                 current_period_end: int = None
                 ):
        super().__init__(customer_id, subscription_id, price_id, current_period_end)
    
    def event(self):
        # Make sure necessary data is present
        if not all([self.customer_id, self.subscription_id, self.price_id, self.current_period_end]):
            raise ValueError("Missing required data to handle checkout completion.")
        
        self.firebase_stripe_service.update_subscription_info(
            subscription_id=self.subscription_id,
            price_id=self.price_id,
            current_period_end=self.current_period_end,
            status="active"
        )
        return self.firebase_user_id
        
    def endSubscription(self):
        try:
            subscription = stripe.Subscription.cancel(self.subscription_id)

            # Ensure the response has the required fields
            if isinstance(subscription, dict):
                if "current_period_end" not in subscription and self.current_period_end:
                    subscription["current_period_end"] = self.current_period_end
            else:
                # Convert to dict if it's a Stripe object
                subscription_dict = subscription.to_dict()
                if "current_period_end" not in subscription_dict and self.current_period_end:
                    subscription_dict["current_period_end"] = self.current_period_end
                subscription = subscription_dict

            return subscription

        except Exception as e:
            import traceback
            print("Error cancelling subscription:", repr(e))
            traceback.print_exc()
            raise