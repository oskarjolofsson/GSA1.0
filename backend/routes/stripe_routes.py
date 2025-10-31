from flask import Blueprint, request, jsonify
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

    url = (StripeSessionService(firebase_uid=request.firebase["uid"], 
                               customer_id=FirebaseStripeService(request.user["uid"])
                               .get_or_create_customer())
           .create_portal_session())

    return jsonify({"url": url})