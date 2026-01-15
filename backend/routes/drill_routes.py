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
