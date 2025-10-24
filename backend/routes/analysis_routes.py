from flask import Blueprint, request, jsonify
from services.firebase.firebase_auth import require_auth
import traceback

from services.analy.analyser import Analysis

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