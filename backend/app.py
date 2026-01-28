"""
Main Flask application for Golf Swing Analyzer Backend

This is the entry point for the Flask application that provides API endpoints
for analyzing golf swing videos using AI/ChatGPT integration.
"""

from flask import Flask, request, app, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from routes.analysis_routes import analysis_bp
from routes.token_routes import token_bp
from routes.stripe_routes import stripe_bp
from routes.user_routes import user_bp
from routes.feedback_routes import feedback_bp
from routes.drill_routes import drills_bp

#thumbnail
from services.cloudflare.thumbnail_service import generate_thumbnail_for_video, make_thumbnail_key
from services.cloudflare.videoStorageService import video_storage_service
from services.cloudflare.config import R2_BUCKET

# Load environment variables
load_dotenv()

def create_app():
    """
    Application factory function that creates and configures the Flask app
    """
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')

    FRONTENDS = [os.getenv("VITE_API_URL"), os.getenv("VITE_API_URL2")]
    FRONTENDS = [o for o in FRONTENDS if o]  # expect ["https://trueswing.se"]

    CORS(
        app,
        origins=FRONTENDS,                   # exact origins
        methods=["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        expose_headers=["Content-Type"]  
    )
    
    print(f"Allowed CORS origins: {FRONTENDS}")
    
    # Register blueprints (route modules)
    app.register_blueprint(analysis_bp)
    app.register_blueprint(token_bp)
    app.register_blueprint(stripe_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(feedback_bp)
    app.register_blueprint(drills_bp)

    # Create upload directory if it doesn't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    return app

# Create the app instance
app = create_app()

@app.route('/')
def health_check():
    return {
        'message': 'hello world'
    }


@app.errorhandler(404)
def not_found(error):
    return {
        'error': 'Not Found',
        'message': 'The requested endpoint does not exist'
    }, 404

@app.errorhandler(500)
def internal_error(error):
    return {
        'error': 'Internal Server Error',
        'message': 'An unexpected error occurred'
    }, 500

@app.get("/ping")
def ping():
    return jsonify(ok=True), 200

@app.route("/api/videos/thumbnail", methods=["POST"])
def generate_thumbnail():
    data = request.get_json()

    video_key = data["video_key"]

    try:
        # Optional: verify the video exists in R2
        video_storage_service.verify_object_exists(video_key)

        # Generate thumbnail
        thumb_key = generate_thumbnail_for_video(video_key)

        # Generate a signed read URL for the thumbnail
        thumb_url = video_storage_service.generate_read_url(thumb_key)

        return jsonify({
            "thumbnail_key": thumb_key,
            "thumbnail_url": thumb_url,
        })

    except Exception as e:
        app.logger.exception("Thumbnail generation failed")
        return jsonify({"error": str(e)}), 500
    
@app.get("/api/videos/thumbnail")
def get_thumbnail():
    video_key = request.args.get("video_key")
    thumb_key = make_thumbnail_key(video_key)

    return jsonify({
        "thumbnail_key": thumb_key,
        "thumbnail_url": video_storage_service.generate_read_url(thumb_key),
    })



if __name__ == '__main__':
    # Run the Flask development server
    app.run(
        host='0.0.0.0',  # Listen on all network interfaces
        port=8000,       # Port 8000 (matches frontend API configuration)
        debug=True       # Enable debug mode for development
    )
    
