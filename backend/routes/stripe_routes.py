from flask import Blueprint, request, jsonify
from backend.services.stripe.handleSubscriptionDeleted import HandleSubscriptionDeleted
from services.firebase.firebase_auth import require_auth
from services.firebase.firebase_stripe import FirebaseStripeService
from services.stripe.stripeSession import StripeSessionService
from services.stripe.stripeWebhook import StripeWebhookService


# Create a Blueprint for stripe routes
stripe_bp = Blueprint('stripe', __name__, url_prefix='/api/v1/stripe')

@stripe_bp.route('/create-checkout-session', methods=['POST'])
@require_auth       
def create_checkout_session():
    """
    Creates a Stripe Checkout session for a subscription plan.
    Called by the frontend when user clicks “Subscribe”.
    """
    # Read data
    body = request.get_json(force=True)
    price_id = body.get("priceId")
    if not price_id:
        return jsonify({"error": "Missing priceId"}), 400

    uid = request.user["uid"]
    
    try:
        session = StripeSessionService(customer_id=FirebaseStripeService(uid).get_or_create_customer(), 
                                    price_id=price_id, 
                                    firebase_uid=uid).create_checkout_session()
        
        return jsonify({"url": session.url}), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': "error with analysis",
            'details': str(e)
        }), 500

@stripe_bp.route('/stripe/webhook', methods=['POST'])
def webhook():
    service = StripeWebhookService(
        sig_header=request.headers.get("Stripe-Signature"),
        payload=request.data
    )
    return service.handle_event()


@stripe_bp.route('/create-portal-session', methods=['POST'])
@require_auth
def create_portal_session():
    try:
        url = (StripeSessionService(firebase_uid=request.user["uid"], 
                                customer_id=FirebaseStripeService(request.user["uid"]).get_or_create_customer())
                .create_portal_session())

        return jsonify({"url": url})
    except Exception as e:
        return jsonify({
            'success': False,
            'error': "error with analysis",
            'details': str(e)
        }), 500
        
@stripe_bp.route('/subscription-status', methods=['GET'])
@require_auth
def subscription_status():
    """
    Get the subscription status of the current user.
    """
    uid = request.user["uid"]
    
    if not uid:
        return jsonify({"status": "Inactive"}), 200
    
    user_data = FirebaseStripeService(uid).db_get_user(uid)
    status = user_data.get("status", "free")
    price_id = user_data.get("stripe_price_id", None)
    return jsonify({"price_id": price_id}), 200

@stripe_bp.post("/cancel-subscription")
@require_auth
def cancel_subscription():
    try:
        uid = request.user["uid"]
        user = FirebaseStripeService(uid).db_get_user()
        
        canceled_sub = HandleSubscriptionDeleted(
            customer_id=user.get("stripe_customer_id"),
            subscription_id=user.get("stripe_subscription_id")
        ).endSubscription()

        return jsonify({
            "message": "Subscription will cancel at period end",
            "status": canceled_sub["status"],
            "current_period_end": canceled_sub["current_period_end"]
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400