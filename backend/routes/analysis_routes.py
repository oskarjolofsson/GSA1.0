from flask import Blueprint, request, jsonify
import traceback
import uuid

# Analysis Service
from services.analy.analyser import analyser

# Firebase
from services.firebase.firebase_past_analysis import FireBasePastAnalysis
from firebase_admin import auth as firebase_auth
from services.firebase.firebase_auth import require_auth
from services.firebase.firebase_analyses import firebase_analyses

# Cloudflare R2
from services.cloudflare.videoStorageService import video_storage_service

# Create a Blueprint for analysis routes
analysis_bp = Blueprint("analysis", __name__, url_prefix="/api/v1/analysis")

# Commented out and not removed because replacement-fetch has not yet been deployed yet
# @analysis_bp.route("/get_previous_analyses", methods=["GET", "POST"])
# def get_past_analyses():
#     try:
#         # Get the token from Authorization header
#         auth_header = request.headers.get("Authorization")
#         if not auth_header or not auth_header.startswith("Bearer "):
#             return jsonify({"error": "No authorization token provided"}), 401

#         # Extract the token (remove 'Bearer ' prefix)
#         id_token = auth_header.split("Bearer ")[1]

#         # Verify the token with Firebase Admin SDK
#         decoded_token = firebase_auth.verify_id_token(id_token)

#         # Extract user_id from the decoded token
#         user_id = decoded_token["uid"]
#         sport = request.form.get("sport") or request.args.get("sport", "golf")
#         offset = int(request.form.get("offset") or request.args.get("offset", 0))
#         limit = int(request.form.get("limit") or request.args.get("limit", 10))
        
#         result = FireBasePastAnalysis(user_id, sport).get_analyses_by_tier(limit=limit, offset=offset)
#         return jsonify(result), 200

#     except Exception as e:
#         traceback.print_exc()
#         print(f"Error retrieving previous analyses: {str(e)}")

#         return (
#             jsonify(
#                 {
#                     "success": False,
#                     "error": "error with retrieving previous analyses",
#                     "details": str(e),
#                 }
#             ),
#             500,
#         )
        

@analysis_bp.route("/create", methods=["POST"])
@require_auth
def create_analysis():
    """
    Create an analysis and return a signed upload URL.

    Arguments (JSON body):
        user_id (str): ID of the authenticated user
        sport (str): Sport type (default: "golf")
        user_prompts (dict): User prompts for analysis

    Returns:
        JSON response with:
        - success
        - analysis_id
        - upload_url
    """
    try:
        
        start_time = float(request.form.get("start_time")) if request.form.get("start_time") else None
        end_time = float(request.form.get("end_time")) if request.form.get("end_time") else None
        user_id = request.user["uid"]
        model = request.form.get("model", "gemini-3-pro-preview")
        
        details = {
            "shape": request.form.get("shape", "unsure"),
            "height": request.form.get("height", "unsure"),
            "misses": request.form.get("miss", "unsure"),
            "extra": request.form.get("extra", ""),
        }
        
        if not user_id:
            return jsonify({"success": False, "error": "missing user_id"}), 400

        analysis_id = "analysis_" + str(uuid.uuid4())
        video_key = f"videos/{user_id}/{analysis_id}/original.mp4"
        upload_url = video_storage_service.generate_upload_url(video_key)

        # # 5. Persist analysis record (example)
        firebase_analyses(user_id=user_id, sport="golf").save_analysis(
            analysis_id=analysis_id,
            details=details,
            video_key=video_key,
            
            video_data={
                "model": model,
                "start_time": start_time,
                "end_time": end_time,
            }
        )

        return jsonify(
            {
                "success": True,
                "analysis_id": analysis_id,
                "upload_url": upload_url,
            }
        ), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify(
            {
                "success": False,
                "error": "error creating analysis",
                "details": str(e),
            }
        ), 500


@analysis_bp.route("/<analysis_id>/uploaded", methods=["POST"])
@require_auth
def confirm_upload(analysis_id):
    try:
        """
        Confirm that the video upload has completed.
        Now the analysis processing can be triggered.

        Arguments:
            analysis_id (str): Analysis identifier

        Returns:
            JSON response with success status
        """
        user_id = request.user["uid"]
        
        # Check that analysis exists
        analysis = firebase_analyses(user_id=user_id, sport="golf").get_analysis_by_id(analysis_id=analysis_id)
        if not analysis:
            return jsonify({"success": False, "error": "analysis not found"}), 404
        
        # set status on analysis to processing
        firebase_analyses(user_id=user_id, sport="golf").set_processing(analysis_id=analysis_id)
        video_storage_service.verify_object_exists(analysis["video_key"])
        video_blob = video_storage_service.get_video_mp4(analysis["video_key"])
        
        analysis_result = analyser.execute(data=analysis, video_blob=video_blob)       
        firebase_analyses(user_id=user_id, sport="golf").set_completed(analysis_id=analysis_id, results=analysis_result)

        return jsonify({"success": True}), 200

    except Exception as e:
        # Set error in analysis record
        firebase_analyses(user_id=user_id, sport="golf").set_failed(
            analysis_id=analysis_id,
            error_message=str(e)
        )
        
        traceback.print_exc()
        
        return jsonify(
            {
                "success": False,
                "error": "error confirming upload",
                "details": str(e),
            }
        ), 500


@analysis_bp.route("/<analysis_id>", methods=["GET"])
@require_auth
def get_analysis(analysis_id):
    try:
        """
        Retrieve analysis details and signed video URL.

        Arguments:
            analysis_id (str): The ID of the analysis

        Returns:
            JSON response with:
            - success
            - analysis data
            - signed video URL
        """

        user_id = request.user["uid"]
        analysis = firebase_analyses(user_id=user_id, sport="golf").get_analysis_by_id(analysis_id=analysis_id)
        if not analysis:
            return jsonify({"success": False, "error": "analysis not found"}), 404
        
        firebase_analyses(user_id=user_id, sport="golf").mark_user_as_viewer(   # Only marks if not the owner
            analysis_id=analysis_id,
            viewer_user_id=user_id
        )

        video_url = video_storage_service.generate_read_url(analysis["video_key"])

        return jsonify(
            {
                "success": True,
                "analysis": analysis,
                "video_url": video_url,
            }
        ), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify(
            {
                "success": False,
                "error": "error retrieving analysis",
                "details": str(e),
                "analysis": {},
            }
        ), 500
