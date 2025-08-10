from flask import Blueprint, request, jsonify, current_app
import os
import shutil
import json
from services.chatgpt_service import ChatGPT_service

# Create a Blueprint for analysis routes
analysis_bp = Blueprint('analysis', __name__)


# For tests
@analysis_bp.route('/api/hello', methods=['GET'])
def hello():
    return jsonify(message="Hello from Flask! (Golf Swing Analyzer)")


@analysis_bp.route('/upload', methods=['POST'])
def upload_video():
    """
    Endpoint to upload a video and perform analysis.
    """
    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400

    video_file = request.files['video']

    # Validate file extension
    if not allowed_file(video_file.filename):
        return jsonify({'error': 'Invalid file type'}), 400

    # Define upload_folder and create it if it doesn't exist
    upload_folder = "backend/uploads/keyframes"
    os.makedirs(upload_folder, exist_ok=True)

    # Create a video directory inside uploads directory as well
    video_folder = "backend/uploads/video"
    os.makedirs(video_folder, exist_ok=True)

    # Save the video_file to the video directory
    video_path = os.path.join(video_folder, video_file.filename)
    video_file.save(video_path)

    # Call the ChatGPT analysis service
    message_prompt = """
        You are an expert golf coach analyzing a complete golf swing through the images I've uploaded.
        These images are in chronological order, showing the full motion from setup to follow-through.
        Based only on what you see, give me two concise drills that would most effectively improve my swing.
        Focus on form, timing, and mechanics. Keep your advice brief and actionable.
    """
    
    gpt_service = ChatGPT_service(
        uploads_folder=upload_folder,
        video_path=video_path,
        message_prompt=message_prompt
    )

    results = gpt_service.get_response()
    # Convert OpenAI response to plain JSON
    try:
        # Common SDK shape provides a JSON string at .output_text
        if hasattr(results, 'output_text') and isinstance(results.output_text, str):
            parsed = json.loads(results.output_text)
            return jsonify(parsed), 200
        # Some SDKs expose a JSON dump method
        if hasattr(results, 'model_dump_json'):
            txt = results.model_dump_json()
            parsed = json.loads(txt)
            return jsonify(parsed), 200
        # Fallback: try to coerce to dict directly (may fail)
        if isinstance(results, dict):
            return jsonify(results), 200
        return jsonify({
            'error': 'Unexpected analysis response format',
            'details': str(type(results))
        }), 500
    except Exception as e:
        return jsonify({
            'error': 'Failed to parse analysis output',
            'details': str(e)
        }), 500

def allowed_file(filename):
    """
    Check if a file is allowed based on its extension.
    """
    allowed_extensions = set(['mp4', 'mov', 'avi', 'mkv'])
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions
