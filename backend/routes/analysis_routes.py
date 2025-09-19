from flask import Blueprint, request, jsonify

from services.file_handeling.Video_file import Video_file
from services.qualityCheck.VideoQuality import VideoQuality
from services.analy.Analysis import GolfAnalysis

# Create a Blueprint for analysis routes
analysis_bp = Blueprint('analysis', __name__)

@analysis_bp.get("/ping")
def ping():
    return jsonify(ok=True), 200
    
@analysis_bp.route('/upload', methods=['POST'])
def golf():
    # Get the file
    if 'video' not in request.files:
        print("No video")
        return jsonify({'error': 'No video file provided'}), 400

    video_FileStorage = request.files['video']
    print("video recieved")

    prompt = ""     # TODO accept text prompt from user as well

    # Store the file
    video_file = Video_file(video_FileStorage)
    print("video stored")

    # Quality, if !q.all()
    q = VideoQuality(video_file)
    print(q.validate())
    print(q.issues())
    if not q.validate():
        return jsonify({"error": q.issues()}), 400
    
    print("Quality checked")
    
    keyframes = video_file.keyframes(1)
    print(keyframes)

    print("keyframes made")

    # Get analysis -> dict(str: any)
    analysis = GolfAnalysis(keyframes).get_response()

    print("analysis made")

    return jsonify({'analysis_results': analysis}), 200
    
