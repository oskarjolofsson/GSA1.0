from services.stripe.stripeEvents import StripeEvents
import stripe

class HandleSubscriptionSwitch(StripeEvents):
    
    def __init__(self, 
                 customer_id: str,
                 subscription_id: str,
                 price_id: str,
                 current_period_end: int
                 ):
        super().__init__(customer_id, subscription_id, price_id, current_period_end)

    def event(self) -> None:
        # Fetch the subscription and current price
        subscription = stripe.Subscription.retrieve(self.subscription_id)
        current_price_id = subscription["items"]["data"][0]["price"]["id"]
        new_price_id = self.price_id

        if current_price_id == new_price_id:
            print("No change: user already on this plan.")
            return

        current_price = stripe.Price.retrieve(current_price_id)
        new_price = stripe.Price.retrieve(new_price_id)

        current_amount = current_price["unit_amount"]
        new_amount = new_price["unit_amount"]

        # Decide proration behavior (or use dashboard defaults)
        if current_amount < new_amount:
            # Upgrade → immediately
            print("Upgrading subscription immediately.")
            stripe.Subscription.modify(
                self.subscription_id,
                items=[{"id": subscription["items"]["data"][0]["id"], "price": new_price_id}],
                proration_behavior="create_prorations",
            )
        else:
            # Downgrade → wait until next billing period
            stripe.Subscription.modify(
                self.subscription_id,
                items=[{"id": subscription["items"]["data"][0]["id"], "price": new_price_id}],
                proration_behavior="none",
            )
            