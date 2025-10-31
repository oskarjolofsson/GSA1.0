from services.stripe.stripeEvents import StripeEvents

class HandleSubscriptionUpdated(StripeEvents):
    
    def __init__(self, 
                 customer_id: str = None,
                 subscription_id: str = None,
                 price_id: str = None,
                 current_period_end: int = None
                 ):
        super().__init__(customer_id)
        self.subscription_id = subscription_id
        self.price_id = price_id
        self.current_period_end = current_period_end
    
    def event(self):
        self.firebase_stripe_service.update_subscription_info(
            subscription_id=self.subscription_id,
            price_id=self.price_id,
            current_period_end=self.current_period_end
        )
        print("Updated subscription info for user:", self.firebase_user_id)
        return self.firebase_user_id