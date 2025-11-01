import stripe
from dotenv import load_dotenv
import os

from services.firebase.firebase import FireBaseService

load_dotenv()

class FirebaseStripeService(FireBaseService):
    def __init__(self, firebase_user_id: str, email: str = None):
        super().__init__(user_id=firebase_user_id)
        self.stripe_api_key = os.getenv("STRIPE_SECRET_KEY")
        stripe.api_key = self.stripe_api_key
        self.doc_ref = self.db.collection('users').document(self.user_id)
        self.stripe_ref = self.doc_ref.collection('stripe').document('customer')
        self.email = email

    def get_or_create_customer(self) -> str:
        user: dict = self.db_get_user()
        
        print("Fetching or creating Stripe customer for user:", self.user_id, "email:", self.email)
        
        # Check if customer already exists in Firestore
        if user.get("stripe_customer_id"):
            print("Found existing Stripe customer for user:", self.user_id)
            customer_id = user["stripe_customer_id"]
            return customer_id
        
        # If not, create a new Stripe customer in Stripe and save to Firestore
        else:
            customer = stripe.Customer.create(
                email=self.email,
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
                "email": self.email,
                "stripe_customer_id": customer_id,
                "stripe_subscription_id": None,
                "stripe_price_id": None,
                "status": "free",
                "current_period_end": None
            })
            self.db_save_user(user)
            return customer_id
            
    def db_get_user(self) -> dict:
        doc = self.stripe_ref.get()
        if doc.exists:
            return doc.to_dict()
        return {}

    def db_save_user(self, user: dict) -> None:
        print("Saving user to Stripe Firestore:", user)
        self.stripe_ref.set(user, merge=True)
        
    def update_subscription_info(self, 
                                 subscription_id: str,
                                 price_id: str,
                                 current_period_end: int,
                                 status: str = None
                                 ) -> None:
        user : dict = self.db_get_user()
        
        # Only update if not None
        updates = {}
        if subscription_id is not None:
            updates["stripe_subscription_id"] = subscription_id
        if price_id is not None:
            updates["stripe_price_id"] = price_id
        if current_period_end is not None:
            updates["current_period_end"] = current_period_end
        if status is not None:
            updates["status"] = status

        print("Updating user", self.user_id, "with", updates)
        
        if updates:
            user.update(updates)
        self.db_save_user(user)
        
    def update_customer_info(self,
                                 email: str = None,
                                 name: str = None,
                                 phone: str = None
                                 ) -> None:
        user : dict = self.db_get_user()
        
        updates = {}
        if email is not None:
            updates["email"] = email
        if name is not None:
            updates["name"] = name
        if phone is not None:
            updates["phone"] = phone

        print("Updating customer info for user", self.user_id, "with", updates)
        
        if updates:
            user.update(updates)
        self.db_save_user(user) 

    def get_user_id_by_customer_id(self, customer_id: str) -> dict | None:
        users_ref = self.db.collection('users')
        query = users_ref.where('stripe_customer_id', '==', customer_id).limit(1)
        results = query.stream()
        for doc in results:
            self.user_id = doc.id
            return doc.id
        return None