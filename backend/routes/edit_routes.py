from flask import Blueprint, request, jsonify, send_file

from services.edit.VideoEdit import trim_video

# Create a Blueprint for analysis routes
edit_bp = Blueprint('edit', __name__, url_prefix='/api/v1/edit')

@edit_bp.route('/trim_video', methods=['POST'])
def trim():
    try:
        # Get the file
        if 'video' not in request.files:
            return jsonify({'error': 'No video file provided'}), 400

        video = request.files['video']
        start = request.form.get('start')
        end = request.form.get('end')
        
        buf = trim_video(video, start, end) 

        return send_file(
            buf,
            mimetype='video/mp4',
            as_attachment=True,
            download_name='trimmed_video.mp4'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500