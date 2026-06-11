# core/infrastructure/payment/revenuecat/exceptions.py


class RevenueCatInfrastructureError(Exception):
    pass


class RevenueCatWebhookVerificationError(RevenueCatInfrastructureError):
    """Raised when a RevenueCat webhook's Authorization header does not match the
    configured shared secret."""
    pass
