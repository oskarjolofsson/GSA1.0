from flask import Blueprint, request, jsonify
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
        start_time = float(request.form.get('start_time', None))
        end_time = float(request.form.get('end_time', None))
        
        analysis = Analysis()
        data = analysis.execute("gpt-5", "golf", video, note, start_time, end_time)
        return jsonify({'analysis_results': data}), 200

    except Exception as e:
        traceback.print_exc()
        print(f"Error during analysis: {str(e)}")
        
        return jsonify({
            'success': False,
            'error': "error with analysis",
            'details': str(e)
        }), 500