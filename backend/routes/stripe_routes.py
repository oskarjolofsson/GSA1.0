from flask import Blueprint, request, jsonify
from services.stripe.handleSubscriptionSwitch import HandleSubscriptionSwitch
from services.stripe.handleCheckoutComplete import HandleCheckoutComplete
from services.firebase.firebase_auth import require_auth
from services.firebase.firebase_stripe import FirebaseStripeService
from services.stripe.stripeSession import StripeSessionService
from services.stripe.stripeWebhook import StripeWebhookService
from services.stripe.stripeInvoiceService import StripeInvoiceService
import traceback


# Create a Blueprint for stripe routes
stripe_bp = Blueprint('stripe', __name__, url_prefix='/stripe')

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
    
    try:
        session = StripeSessionService(customer_id=FirebaseStripeService(uid, email).get_or_create_customer(),
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
    service = StripeWebhookService(
        sig_header=request.headers.get("Stripe-Signature"),
        payload=request.data
    )
    return service.handle_event()


@stripe_bp.route('/create-portal-session', methods=['POST'])
@require_auth
def create_portal_session():
    try:
        uid = request.user["uid"]        
        email = request.user.get("email")
        url = (StripeSessionService(firebase_uid=uid,
                                customer_id=FirebaseStripeService(firebase_user_id=uid, email=email).get_or_create_customer())
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
    email = request.user.get("email")
    
    if not uid:
        return jsonify({"status": "Inactive"}), 200

    user_data = FirebaseStripeService(uid, email=email).db_get_user()
    status = user_data.get("status", "free")
    price_id = user_data.get("stripe_price_id", None)
    return jsonify({"price_id": price_id, "status": status}), 200

@stripe_bp.post("/cancel-subscription")
@require_auth
def cancel_subscription():
    try:
        uid = request.user["uid"]
        email = request.user.get("email")
        user = FirebaseStripeService(uid, email=email).db_get_user()

        canceled_sub = HandleCheckoutComplete(
            customer_id=user.get("stripe_customer_id"),
            subscription_id=user.get("stripe_subscription_id"),
            current_period_end=user.get("current_period_end")
        ).endSubscription()

        return jsonify({
            "message": "Subscription will cancel at period end",
            "status": canceled_sub["status"],
            "current_period_end": canceled_sub["current_period_end"]
        })

    except Exception as e:
        print(f"Error cancelling subscription: {e}")
        return jsonify({"error": str(e)}), 400
    
@stripe_bp.post("/switch-subscription")
@require_auth
def switch_subscription():
    try:
        body = request.get_json(force=True)
        new_price_id = body.get("newPriceId")
        if not new_price_id:
            return jsonify({"error": "Missing newPriceId"}), 400

        uid = request.user["uid"]
        email = request.user.get("email")
        user = FirebaseStripeService(uid, email=email).db_get_user()
        
        updated_sub = HandleSubscriptionSwitch(
            customer_id=user.get("stripe_customer_id"),
            subscription_id=user.get("stripe_subscription_id"),
            price_id=new_price_id,
            current_period_end=user.get("current_period_end")
        )
        updated_sub.execute()

        return jsonify({
            "success": True,
            "message": "Subscription switched successfully"
        })

    except Exception as e:
        print(f"Error switching subscription: {e}")
        
        traceback.print_exc()
        return jsonify({"error": str(e)}), 400
    
@stripe_bp.route('/verify-session', methods=['GET'])
@require_auth
def verify_session():
    """
    Verifies the checkout session after a successful payment.
    Called by the frontend on the success page.
    """
    session_id = request.args.get('session_id')
    print("Verifying session ID:", session_id)
    
    if not session_id:
        return jsonify({"error": "Missing session_id"}), 400
    
    try:
        session_status = StripeSessionService().successful_checkout_session(session_id)
        print("Session status:", session_status)

        if not session_status:
            return jsonify({"error": "Payment not completed"}), 400

        return jsonify({"message": "Purchase verified successfully"}), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': "error verifying session",
            'details': str(e)
        }), 500

@stripe_bp.route('/upcoming-invoice_price', methods=['GET'])
@require_auth
def upcoming_invoices():
    try:
        uid = request.user["uid"]
        new_price_id = request.args.get("newPriceId")

        new_charge = StripeInvoiceService(uid, new_price_id).get_upcoming_invoice_price()
        return jsonify({"new_charge": new_charge}), 200
    except Exception as e:
        print(f"Error fetching upcoming invoices: {e}")
        return jsonify({"error": str(e)}), 500