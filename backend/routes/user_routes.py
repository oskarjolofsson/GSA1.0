from flask import Blueprint, request, jsonify
from services.firebase.firebase_auth import require_auth
from services.firebase.firebase_tokens import FireBaseTokens
from services.firebase.firebase_stripe import FirebaseStripeService


# Create the blueprint
user_bp = Blueprint('users', __name__, url_prefix='/api/v1/users')

@user_bp.route('/register', methods=['POST']) 
@require_auth
def register_user():
    try:
        uid = request.user["uid"]
        email = request.user.get("email")
        FireBaseTokens(user_id=uid).initialize_user_tokens()
        FirebaseStripeService(firebase_user_id=uid, email=email).get_or_create_customer()

        return jsonify({
            "success": True,
        }), 201
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


