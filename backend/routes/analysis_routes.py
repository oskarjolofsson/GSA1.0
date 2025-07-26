from flask import Blueprint, request, jsonify, current_app
import os
from backend.services.chatgpt_service import ChatGPT_service

# Create a Blueprint for analysis routes
analysis_bp = Blueprint('analysis', __name__)

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

    # Save the file to the uploads directory
    upload_folder = current_app.config['UPLOAD_FOLDER']
    file_path = os.path.join(upload_folder, video_file.filename)
    video_file.save(file_path)

    # Call the ChatGPT analysis service
    message_prompt = """
        You are an expert golf coach analyzing a complete golf swing through the images I've uploaded.
        These images are in chronological order, showing the full motion from setup to follow-through.
        Based only on what you see, give me two concise drills that would most effectively improve my swing.
        Focus on form, timing, and mechanics. Keep your advice brief and actionable.
    """
    
    gpt_service = ChatGPT_service(
        uploads_folder=upload_folder,
        video_path=file_path,
        message_prompt=message_prompt
    )

    results = gpt_service.get_response()
    # Return json with summary, drills, observations and phase_notes
    return jsonify(results), 200

def allowed_file(filename):
    """
    Check if a file is allowed based on its extension.
    """
    allowed_extensions = set(['mp4', 'mov', 'avi', 'mkv'])
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

