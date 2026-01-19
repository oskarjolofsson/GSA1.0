from flask import Blueprint, request, jsonify
import traceback
import uuid

# Analysis Service
from services.analy.analyser import analyser

# Firebase
from firebase_admin import auth as firebase_auth
from services.firebase.firebase_auth import require_auth
from services.firebase.firebase_analyses import firebase_analyses
from services.firebase.firebase_drill import FirebaseDrillService
from services.cloudflare.videoStorageService import video_storage_service

drills_bp = Blueprint(
    "drills",
    __name__,
    url_prefix="/api/v1/drills"
)

@drills_bp.route("", methods=["GET"])
@require_auth
def list_drills():
    try:
        user_id = request.user["uid"]

        sport = request.args.get("sport", "golf")
        limit = int(request.args.get("limit", 20))
        offset = int(request.args.get("offset", 0))

        drills = FirebaseDrillService(user_id=user_id).list_drills_for_user()

        return jsonify({
            "success": True,
            "drills": drills
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": "error retrieving drills",
            "details": str(e)
        }), 500
        

@drills_bp.route("<drill_id>", methods=["GET"])
@require_auth
def get_drill(drill_id):
    try:
        user_id = request.user["uid"]

        drill = FirebaseDrillService(user_id=user_id).get_drill(drill_id=drill_id)
        
        image_url = video_storage_service.get_video_url(drill["image_key"]) if drill.get("image_key") else None

        return jsonify({
            "success": True,
            "drill": drill,
            "image_url": image_url
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": "error retrieving drill",
            "details": str(e)
        }), 500