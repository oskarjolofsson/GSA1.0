from flask import Blueprint, request, jsonify
from services.firebase.firebase_auth import require_auth
import traceback
from firebase_admin import auth as firebase_auth
import time

from services.analy.analyser import Analysis
from services.firebase.firebase_past_analysis import FireBasePastAnalysis

# Create a Blueprint for analysis routes
analysis_bp = Blueprint("analysis", __name__, url_prefix="/api/v1/analysis")


@analysis_bp.route("/upload_video", methods=["POST"])
def golf():
    try:
        # Get the file
        if "video" not in request.files:
            return jsonify({"error": "No video file provided"}), 400

        video = request.files["video"]
        start_time_str = request.form.get("start_time")
        end_time_str = request.form.get("end_time")
        start_time = float(start_time_str) if start_time_str is not None else None
        end_time = float(end_time_str) if end_time_str is not None else None
        user_id = request.form.get("user_id")
        model = request.form.get("model", "gemini-3-pro-preview")
        
        details = {
            "shape": request.form.get("shape", "unsure"),
            "height": request.form.get("height", "unsure"),
            "misses": request.form.get("miss", "unsure"),
            "extra": request.form.get("extra", ""),
        }

        analysis = Analysis()
        data = analysis.execute(
            model_name=model,
            sport_name="golf",
            video_FileStorage=video,
            start_time=start_time,
            end_time=end_time,
            user_id=user_id,
            shape=details.get("shape", "unsure"),
            height=details.get("height", "unsure"),
            misses=details.get("misses", "unsure"),
            extra=details.get("extra", "")
        )

        return jsonify({"analysis_results": data}), 200

    except Exception as e:
        traceback.print_exc()
        print(f"Error during analysis: {str(e)}")

        return (
            jsonify(
                {"success": False, "error": "error with analysis", "details": str(e)}
            ),
            500,
        )


@analysis_bp.route("/get_previous_analyses", methods=["GET", "POST"])
def get_past_analyses():
    try:
        # Get the token from Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "No authorization token provided"}), 401

        # Extract the token (remove 'Bearer ' prefix)
        id_token = auth_header.split("Bearer ")[1]

        # Verify the token with Firebase Admin SDK
        decoded_token = firebase_auth.verify_id_token(id_token)

        # Extract user_id from the decoded token
        user_id = decoded_token["uid"]
        sport = request.form.get("sport", "golf")
        analyses = FireBasePastAnalysis(user_id, sport).get_analyses_by_tier()
        return jsonify({"analyses": analyses}), 200

    except Exception as e:
        traceback.print_exc()
        print(f"Error retrieving previous analyses: {str(e)}")

        return (
            jsonify(
                {
                    "success": False,
                    "error": "error with retrieving previous analyses",
                    "details": str(e),
                }
            ),
            500,
        )
