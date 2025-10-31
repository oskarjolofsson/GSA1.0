import stripe
from dotenv import load_dotenv
import os

from services.firebase.firebase import FireBaseService

load_dotenv()

class FirebaseStripeService(FireBaseService):
    def __init__(self, firebase_user_id: str):
        super().__init__(user_id=firebase_user_id)
        self.stripe_api_key = os.getenv("STRIPE_SECRET_KEY")
        stripe.api_key = self.stripe_api_key

    def get_or_create_customer(self) -> str:
        user: dict = self.db_get_user(self.user_id)
        email: str | None = user.get("email")
        
        # Check if customer already exists in Firestore
        if user.get("stripe_customer_id"):
            customer_id = user["stripe_customer_id"]
            return customer_id
        
        # If not, create a new Stripe customer in Stripe and save to Firestore
        else:
            customer = stripe.Customer.create(
                email=email,
                metadata={"firebase_uid": self.user_id}
            )
            customer_id = customer.id
            
            # Stripe status meaning:
            
            # free: user not paying
            # trialing: in trial period
            # active: paying subscriber
            # past_due: payment failed
            # canceled: subscription canceled
            # inactive: expired or deactivated
            
            
            user.update({
                "email": email,
                "stripe_customer_id": customer_id,
                "stripe_subscription_id": None,
                "stripe_price_id": None,
                "status": "free",
                "current_period_end": None
            })
            self.db_save_user(user)
            return customer_id
            
    def db_get_user(self, uid: str) -> dict:
        doc_ref = self.db.collection('users').document(uid)
        doc = doc_ref.get()
        if doc.exists:
            return doc.to_dict()
        return {}

    def db_save_user(self, user: dict) -> None:
        doc_ref = self.db.collection('users').document(self.user_id)
        doc_ref.set(user, merge=True)