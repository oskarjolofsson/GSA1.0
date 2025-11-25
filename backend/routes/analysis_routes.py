from flask import Blueprint, request, jsonify
from services.firebase.firebase_auth import require_auth
import traceback
from firebase_admin import auth as firebase_auth

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
        note = request.form.get("note", "")
        start_time_str = request.form.get("start_time")
        end_time_str = request.form.get("end_time")
        start_time = float(start_time_str) if start_time_str is not None else None
        end_time = float(end_time_str) if end_time_str is not None else None
        user_id = request.form.get("user_id")

        analysis = Analysis()
        data = analysis.execute(
            model_name="gpt-5",
            sport_name="golf",
            video_FileStorage=video,
            prompt=note,
            start_time=start_time,
            end_time=end_time,
            user_id=user_id,
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


@analysis_bp.route("/get_previous_drills", methods=["GET", "POST"])
def get_golf_drills():
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
        drills = FireBasePastAnalysis(user_id, sport).get_drills_by_tier()
        return jsonify({"drills": drills}), 200

    except Exception as e:
        traceback.print_exc()
        print(f"Error retrieving previous drills: {str(e)}")

        return (
            jsonify(
                {
                    "success": False,
                    "error": "error with retrieving previous drills",
                    "details": str(e),
                }
            ),
            500,
        )


# Route to test analysis output format
@analysis_bp.route("/test_analysis_output", methods=["GET"])
def test_analysis_output():
    analysis = {
        "quick_summary": {
            "diagnosis": "Shots start left because the club swings left through the ball and the face closes fast.",
            "key_fix": "Make swings that finish to “right field” while holding the face quiet (no sudden roll).",
        },
        "key_findings": [
            {
                "title": "Across-the-ball path",
                "severity": "high",
                "icon": "path-arrow",
                "what_you_did": "Club comes down in front of you and exits left of the target.",
                "why_it_matters": "This sends the start line left and makes pulls.",
                "try_this": "Place an alignment stick on the ground at the target and another 1 foot in front of the ball aiming slightly right. Swing so the clubhead starts right of that front stick.",
            },
            {
                "title": "Face closes early",
                "severity": "high",
                "icon": "clubface",
                "what_you_did": "Hands roll over quickly after impact.",
                "why_it_matters": "A fast roll shuts the face and hooks or pulls the ball.",
                "try_this": "Hit waist‑to‑waist swings and hold a “hold‑off” finish: chest-high, logo on glove pointing slightly left of target, clubface not flipped.",
            },
            {
                "title": "Aim and ball position",
                "severity": "medium",
                "icon": "alignment-stick",
                "what_you_did": "Shoulders look a bit left and the ball may be a touch forward for this iron.",
                "why_it_matters": "Left aim plus forward ball makes left starts more likely.",
                "try_this": "Lay a stick along your toes parallel to the target. With a 7‑iron, place the ball just left of center.",
            },
            {
                "title": "Head drifts toward the ball",
                "severity": "medium",
                "icon": "balance",
                "what_you_did": "Your head moves closer to the ball on the downswing.",
                "why_it_matters": "This pulls the swing left and hurts contact.",
                "try_this": "Wear a cap and keep the logo over the ball until after you hit. Smooth, no lunge.",
            },
            {
                "title": "Backswing runs long",
                "severity": "low",
                "icon": "tempo",
                "what_you_did": "Arms lift high and the club goes past a controlled top.",
                "why_it_matters": "More length means more timing and face roll.",
                "try_this": "Three‑quarter swings: stop when your lead arm is across your shoulder, then swing through.",
            },
        ],
        "video_breakdown": {
            "address": "Athletic setup and good posture. Square up shoulders and check ball just left of center with this club.",
            "takeaway": "Good one-piece start. Keep the clubface looking at the ball a touch longer and the clubhead just outside your hands.",
            "top": "Shorten to a 3/4 top. Feel the club point more to the target, not past it.",
            "impact": "Hands ahead and weight forward are solid. Keep the face quiet and swing the handle a bit more to right field.",
            "finish": "Balanced on your lead foot. Hold a chest‑high 'hold‑off' finish for two seconds.",
        },
        "premium_suggestions": {
            "progress_tracking": "Track start line, divot direction, and how long you can hold the chest‑high finish.",
            "before_after": "Before: ball starts left with a fast roll of the hands. After: ball starts near target or slightly right with a calmer face and divots pointing just right.",
            "personal_drill_pack": [
                "Right‑field alignment drill (two sticks; start the ball right of the front stick)",
                "9‑to‑3 hold‑off swings (waist‑to‑waist, pause the finish)",
                "Feet‑together half swings (smooth path and balance)",
            ],
            "biggest_leak": "Club swinging left with a closing face.",
        },
    }
