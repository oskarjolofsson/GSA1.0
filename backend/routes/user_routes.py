from flask import Blueprint, request, jsonify
from services.firebase.firebase_auth import require_auth
from services.firebase.firebase_tokens import FireBaseTokens
from services.firebase.firebase_stripe import FirebaseStripeService
from services.firebase.firebase_users import FirebaseUsersService
import traceback

# Create the blueprint
user_bp = Blueprint('users', __name__, url_prefix='/api/v1/users')

@user_bp.route('/register', methods=['POST']) 
@require_auth
def register_user():
    try:
        uid = request.user["uid"]
        email = request.user.get("email")
        name = request.user.get("name", "")
        FireBaseTokens(user_id=uid).initialize_user_tokens()
        FirebaseStripeService(firebase_user_id=uid, email=email).get_or_create_customer()
        FirebaseUsersService(user_id=uid).create_user(email=email, name=name)
        

        return jsonify({
            "success": True,
        }), 201
    except Exception as e:
        traceback.print_exc()
        
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
        

@user_bp.route('/consent', methods=['POST']) 
@require_auth
def set_user_consent():
    try:
        uid = request.user["uid"]
        data = request.get_json()
        consent = data.get("consent", False)
        FirebaseUsersService(user_id=uid).update_user({"consent": consent})

        return jsonify({
            "success": True,
        }), 201
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
        
@user_bp.route('/consent', methods=['GET']) 
@require_auth
def get_user_consent():
    try:
        uid = request.user["uid"]
        consent = FirebaseUsersService(user_id=uid).get_user_by_id().get("consent", False)

        return jsonify({
            "success": True,
            "consent": consent
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "consent": False
        }), 500

