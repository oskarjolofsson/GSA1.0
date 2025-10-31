from flask import Blueprint, request, jsonify
from backend.services.firebase.firebase_auth import require_auth
from backend.services.firebase.firebase_stripe import FirebaseStripeService
from backend.services.stripe.stripeSession import StripeSessionService

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
    email = request.user.get("email")
    if not email:
        return jsonify({"error": "User email not found"}), 400
    try:
        session = StripeSessionService(customer_email=email, 
                                    customer_id=FirebaseStripeService(uid).get_or_create_customer(email, uid), 
                                    price_id=price_id, 
                                    firebase_uid=uid).create_checkout_session()
        
        return jsonify({"url": session.url}), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': "error with analysis",
            'details': str(e)
        }), 500

@stripe_bp.route('/webhook', methods=['POST'])
def webhook():
    return jsonify({'message': 'This is a placeholder for handling webhooks.'}), 200

@stripe_bp.route('/create-portal-session', methods=['POST'])
def create_portal_session():
    return jsonify({'message': 'This is a placeholder for creating a portal session.'}), 200