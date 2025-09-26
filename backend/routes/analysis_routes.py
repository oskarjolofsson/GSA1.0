from flask import Blueprint, request, jsonify
import json

from services.file_handeling.Video_file import Video_file
from services.qualityCheck.VideoQuality import VideoQuality
from services.analy.Analysis import GolfAnalysis

# Create a Blueprint for analysis routes
analysis_bp = Blueprint('analysis', __name__)
    
@analysis_bp.route('/upload', methods=['POST'])
def golf():
    # Get the file
    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400

    video_FileStorage = request.files['video']

    video_file = Video_file(video_FileStorage)

    q = VideoQuality(video_file)
    if not q.validate():
        return jsonify({"error": q.issues()}), 400
    
    keyframes = video_file.keyframes(15)

    analysis = GolfAnalysis(keyframes, "").get_response()   # TODO take in prompt from frontend as well
    raw_text = analysis.output_text
    try:
        data = json.loads(raw_text)
    except ValueError as e:
        return jsonify({"error": "Error parsing AI response"})
    
    keyframes.removeAll()
    video_file.remove()

    return jsonify({'analysis_results': data}), 200

# TODO put all logic in services, only include return and gathering of files
    
