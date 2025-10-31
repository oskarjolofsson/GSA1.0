import stripe
from dotenv import load_dotenv
import os

load_dotenv()

class StripeSessionService:
    
    def __init__(self, customer_email: str, customer_id: str, price_id: str, firebase_uid: str = None):
        self.customer_email = customer_email
        self.customer_id = customer_id 
        self.price_id = price_id
        self.firebase_uid = firebase_uid
        self.stripe_api_key = os.getenv("STRIPE_SECRET_KEY")
        self.APP_URL = os.getenv("APP_URL")
        stripe.api_key = self.stripe_api_key
    
    def create_checkout_session(self):
        if not all([self.customer_id, self.price_id, self.APP_URL]):
            raise ValueError("Missing required data to create checkout session")
        
        session = stripe.checkout.Session.create(
            mode="subscription",
            customer=self.customer_id,
            line_items=[{"price": self.price_id, "quantity": 1}],
            success_url=f"{self.APP_URL}/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{self.APP_URL}/billing/cancel",
            client_reference_id=self.firebase_uid,
            subscription_data={"metadata": {"firebase_uid": self.firebase_uid}},
            allow_promotion_codes=True,
            customer_email=self.customer_email
        )   
        
        return session
    
   
    
    