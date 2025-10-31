import os
import stripe
from dotenv import load_dotenv

class StripeService:
    
    def __init__(self):
        load_dotenv()
        self.stripe_api_key = os.getenv("STRIPE_SECRET_KEY")
        self.APP_URL = os.getenv("APP_URL")
        stripe.api_key = self.stripe_api_key
        
        