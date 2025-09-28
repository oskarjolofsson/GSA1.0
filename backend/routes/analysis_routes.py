from flask import Blueprint, request, jsonify

from services.analy.analysis_service import get_response

# Create a Blueprint for analysis routes
analysis_bp = Blueprint('analysis', __name__, url_prefix='/api/v1/analysis')

@analysis_bp.route('/upload_video', methods=['POST'])
def golf():
    try:
        # Get the file
        if 'video' not in request.files:
            return jsonify({'error': 'No video file provided'}), 400
        
        # Method from analysis service
        data = get_response(request.files['video', ""]) # TODO take in prompt from frontend as well
        return jsonify({'analysis_results': data}), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500