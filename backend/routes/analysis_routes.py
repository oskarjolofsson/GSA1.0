from flask import Blueprint, request, jsonify, current_app
import os
import shutil
import json

from services.file_handeling.Video_file import Video_file
from services.qualityCheck.VideoQuality import VideoQuality
from services.analy.Analysis import GolfAnalysis

# Create a Blueprint for analysis routes
analysis_bp = Blueprint('analysis', __name__)


# For tests
@analysis_bp.route('/api/hello', methods=['GET'])
def hello():
    return jsonify(message="Hello from Flask! (Golf Swing Analyzer)")

@analysis_bp.get("/ping")
def ping():
    return jsonify(ok=True), 200


# @analysis_bp.route('/upload', methods=['POST'])
# def upload_video():
#     """
#     Endpoint to upload a video and perform analysis.
#     """
#     from services.chatgpt_service import ChatGPT_service

#     if 'video' not in request.files:
#         print("No video")
#         return jsonify({'error': 'No video file provided'}), 400

#     video_file = request.files['video']

#     # Validate file extension
#     if not allowed_file(video_file.filename):
#         return jsonify({'error': 'Invalid file type'}), 400

#     # Define upload_folder and create it if it doesn't exist
#     upload_folder = "uploads/keyframes"
#     os.makedirs(upload_folder, exist_ok=True)

#     # Create a video directory inside uploads directory as well
#     video_folder = "uploads"
#     os.makedirs(video_folder, exist_ok=True)

#     # Save the video_file to the video directory
#     video_path = os.path.join(video_folder, video_file.filename)
#     video_file.save(video_path)

#     # Call the ChatGPT analysis service
#     message_prompt = """
#         You are an expert golf coach analyzing a complete golf swing through the images I've uploaded.
#         These images are in chronological order, showing the full motion from setup to follow-through.
#         Based only on what you see, give me two concise drills that would most effectively improve my swing.
#         Focus on form, timing, and mechanics. Keep your advice brief and actionable.
#     """
    
#     print("In analysis_routes")
#     print("uploads_folder" + upload_folder)
#     print("uploads_folder" + video_path)
#     print()

#     gpt_service = ChatGPT_service(
#         uploads_folder=upload_folder,
#         video_path=video_path,
#         message_prompt=message_prompt
#     )

#     results = gpt_service.get_response()    # Response-object

#     # Format the return data
    
#     raw_text = results.output_text   # Dictionary in String format
#     data = json.loads(raw_text)      # now it's a Python dict

#     print(type(data))  # <class 'dict'>
#     print(data["summary"])
#     print(data["drills"][0])
#     print(data["phase_notes"]["setup"])

#     # Return the string given:
#     return jsonify({'analysis_results': data}), 200

    
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
    
    


def allowed_file(filename):
    """
    Check if a file is allowed based on its extension.
    """
    allowed_extensions = set(['mp4', 'mov', 'avi', 'mkv'])
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions
