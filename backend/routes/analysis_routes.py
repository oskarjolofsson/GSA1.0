from flask import Blueprint, request, jsonify, current_app
import os

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

    # TODO: Call the ChatGPT analysis service here
    # mock_response = {'summary': 'This is a mock summary', 'drills': [], 'keyframes': []}

    # For now, return mock response
    return jsonify({'message': 'Video uploaded successfully'}), 200

def allowed_file(filename):
    """
    Check if a file is allowed based on its extension.
    """
    allowed_extensions = set(['mp4', 'mov', 'avi', 'mkv'])
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

