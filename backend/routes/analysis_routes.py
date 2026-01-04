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

        # Extract the analysis ID if it was added
        analysis_id = data.pop("_id", None)
        
        return jsonify({"analysis_results": data, "id": analysis_id}), 200

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
        sport = request.form.get("sport") or request.args.get("sport", "golf")
        offset = int(request.form.get("offset") or request.args.get("offset", 0))
        limit = int(request.form.get("limit") or request.args.get("limit", 10))
        
        result = FireBasePastAnalysis(user_id, sport).get_analyses_by_tier(limit=limit, offset=offset)
        return jsonify(result), 200

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

@analysis_bp.route("/share", methods=["GET"])
def get_analysis_by_id():
    """
    Fetch a single analysis by its ID via query parameter.
    This is a public endpoint - anyone with the ID can view the analysis.
    Usage: GET /api/v1/analysis/share?id={analysis_id}
    """
    try:
        
        # Get the token from Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "No authorization token provided"}), 401

        # Extract the token (remove 'Bearer ' prefix)
        id_token = auth_header.split("Bearer ")[1]
        decoded_token = firebase_auth.verify_id_token(id_token)
        sender_user_id = decoded_token["uid"]
        
        share_user_id = request.args.get("share_user_id")
        print(f"Share user ID from request: {share_user_id}")
        if not share_user_id:
            user_id = sender_user_id
        else:
            user_id = share_user_id
        
        analysis_id = request.args.get("id") 
        
        print(f"Fetching analysis ID: {analysis_id} for user ID: {user_id}")
        
        if not analysis_id:
            return jsonify({"error": "Missing analysis ID parameter"}), 400
        
        analysis = FireBasePastAnalysis(user_id, "golf").get_analysis_by_id(analysis_id=analysis_id)
        
        if not analysis:
            return jsonify({"error": "Analysis not found"}), 404
        
        return jsonify({"analysis_results": analysis}), 200
    
    except Exception as e:
        traceback.print_exc()
        print(f"Error retrieving analysis {request.args.get('id')}: {str(e)}")
        
        return (
            jsonify(
                {
                    "success": False,
                    "error": "error with retrieving analysis",
                    "details": str(e),
                }
            ),
            500,
        )