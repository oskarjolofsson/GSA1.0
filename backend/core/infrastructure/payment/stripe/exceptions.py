

# app/infrastructure/stripe/exceptions.py
class StripeInfrastructureError(Exception):
    pass


class StripeWebhookVerificationError(StripeInfrastructureError):
    pass