"""
Main Flask application for Golf Swing Analyzer Backend

This is the entry point for the Flask application that provides API endpoints
for analyzing golf swing videos using AI/ChatGPT integration.
"""

from flask import Flask, app, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from routes.analysis_routes import analysis_bp
from routes.token_routes import token_bp

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
        allow_headers=["Content-Type","Authorization"],
    )
    
    print(f"Allowed CORS origins: {FRONTENDS}")
    
    # Register blueprints (route modules)
    app.register_blueprint(analysis_bp)
    app.register_blueprint(token_bp)
    
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

if __name__ == '__main__':
    # Run the Flask development server
    app.run(
        host='0.0.0.0',  # Listen on all network interfaces
        port=8000,       # Port 8000 (matches frontend API configuration)
        debug=True       # Enable debug mode for development
    )
    
