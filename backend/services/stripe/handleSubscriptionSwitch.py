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
            return

        current_price = stripe.Price.retrieve(current_price_id)
        new_price = stripe.Price.retrieve(new_price_id)

        current_amount = current_price["unit_amount"]
        new_amount = new_price["unit_amount"]

        # Decide proration behavior (or use dashboard defaults)
        if current_amount < new_amount:
            # Upgrade → immediately
            updated = stripe.Subscription.modify(
                self.subscription_id,
                items=[{
                    "id": subscription["items"]["data"][0]["id"],
                    "price": new_price_id,
                }],
                proration_behavior="create_prorations",
                payment_behavior="default_incomplete",  # replaces 'charge_automatically'
                expand=["latest_invoice.payment_intent"]
            )
            
            try:
                invoice_id = updated["latest_invoice"]
                stripe.Invoice.pay(invoice_id)
            except Exception as e:
                print(f"Error paying invoice: {e}")

        else:
            # Downgrade → wait until next billing period
            print("Downgrading subscription at period end.")
            stripe.Subscription.modify(
                self.subscription_id,
                items=[{"id": subscription["items"]["data"][0]["id"], "price": new_price_id}],
                proration_behavior="none",
            )
            