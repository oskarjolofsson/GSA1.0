# app/infrastructure/stripe/client.py
from stripe import StripeClient

from core.config import STRIPE_PUBLISH_KEY, STRIPE_SECRET_KEY

stripe_client = StripeClient(STRIPE_SECRET_KEY)