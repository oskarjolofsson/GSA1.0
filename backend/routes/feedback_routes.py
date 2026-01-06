from flask import Blueprint, request, jsonify
from services.firebase.firebase_auth import require_auth
from services.feedback.feedback import FeedbackService

# Create the blueprint
feedback_bp = Blueprint('feedback', __name__, url_prefix='/api/v1/feedback')

@feedback_bp.route('/give', methods=['POST']) 
@require_auth
def register_user():
    try:
        uid = request.user["uid"]
        rating = request.json.get("rating")
        comments = request.json.get("comments")
        
        # Save to database and process feedback (omitted for brevity)
        FeedbackService().save_feedback(user_id=uid, rating=rating, comments=comments)

        return jsonify({
            "success": True,
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


