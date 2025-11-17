from flask import Blueprint, request, jsonify
from services.firebase.firebase_auth import require_auth
import traceback
from firebase_admin import auth as firebase_auth

from services.analy.analyser import Analysis
from services.firebase.firebase_past_analysis import FireBasePastAnalysis

# Create a Blueprint for analysis routes
analysis_bp = Blueprint('analysis', __name__, url_prefix='/api/v1/analysis')

@analysis_bp.route('/upload_video', methods=['POST'])
def golf():
    try:
        # Get the file
        if 'video' not in request.files:
            return jsonify({'error': 'No video file provided'}), 400

        video = request.files['video']
        note = request.form.get('note', '')
        start_time_str = request.form.get('start_time')
        end_time_str = request.form.get('end_time')
        start_time = float(start_time_str) if start_time_str is not None else None
        end_time = float(end_time_str) if end_time_str is not None else None
        user_id = request.form.get('user_id')
        
        analysis = Analysis()
        data = analysis.execute(model_name="gpt-5", 
                                sport_name="golf", 
                                video_FileStorage=video, 
                                prompt=note, 
                                start_time=start_time, 
                                end_time=end_time, 
                                user_id=user_id)
        
        return jsonify({'analysis_results': data}), 200

    except Exception as e:
        traceback.print_exc()
        print(f"Error during analysis: {str(e)}")
        
        return jsonify({
            'success': False,
            'error': "error with analysis",
            'details': str(e)
        }), 500


@analysis_bp.route('/get_previous_drills', methods=['GET', 'POST'])
def get_golf_drills():
    try:
        # Get the token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'No authorization token provided'}), 401
        
        # Extract the token (remove 'Bearer ' prefix)
        id_token = auth_header.split('Bearer ')[1]
        
        # Verify the token with Firebase Admin SDK
        decoded_token = firebase_auth.verify_id_token(id_token)
        
        # Extract user_id from the decoded token
        user_id = decoded_token['uid']
        sport = request.form.get('sport', 'golf')
        drills = FireBasePastAnalysis(user_id, sport).get_drills_by_tier()
        return jsonify({'drills': drills}), 200

    except Exception as e:
        traceback.print_exc()
        print(f"Error retrieving previous drills: {str(e)}")

        return jsonify({
            'success': False,
            'error': "error with retrieving previous drills",
            'details': str(e)
        }), 500