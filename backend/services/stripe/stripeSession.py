import stripe
from dotenv import load_dotenv
import os

from services.stripe.stripe import StripeService

load_dotenv()

class StripeSessionService(StripeService):

    def __init__(self, customer_id: str = None, price_id: str = None, firebase_uid: str = None):
        self.customer_id = customer_id
        self.price_id = price_id
        self.firebase_uid = firebase_uid
        super().__init__()
    
    def create_checkout_session(self):
        if not all([self.customer_id, self.price_id, self.APP_URL]):
            raise ValueError("Missing required data to create checkout session")
        
        session = stripe.checkout.Session.create(
            mode="subscription",
            customer=self.customer_id,
            line_items=[{"price": self.price_id, "quantity": 1}],
            success_url=f"{self.VITE_API_URL}/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{self.VITE_API_URL}/billing/cancel",
            client_reference_id=self.firebase_uid,
            subscription_data={"metadata": {"firebase_uid": self.firebase_uid}},
            allow_promotion_codes=True,
        )   
        
        return session

    def create_portal_session(self) -> str:
        if not self.firebase_uid or not self.customer_id:
            raise ValueError("Missing firebase_uid or customer_id to create portal session")

        session = stripe.billing_portal.Session.create(
            customer=self.customer_id,
            return_url=f"{self.APP_URL}/billing",
        )
        return session.url

    def successful_checkout_session(self, session_id: str) -> str:
        session = stripe.checkout.Session.retrieve(session_id)
        return session.payment_status == 'paid'
    