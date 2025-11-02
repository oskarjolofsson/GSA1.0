

from services.firebase.firebase_stripe import FirebaseStripeService

# Example usage
# Find user ID by Stripe customer ID
firebase_stripe = FirebaseStripeService()  
userId = firebase_stripe.get_user_id_by_customer_id("cus_TLcfGWJG4OVzP7")
print("Found user ID:", userId)

# Register purchase
firebase_stripe.update_subscription_info(
            subscription_id="sub_123456789",
            price_id="price_123456789",
            current_period_end=1700000000,
            status="active"
        )
print("Updated subscription info for user:", firebase_stripe.user_id)

