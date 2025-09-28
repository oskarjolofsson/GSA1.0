"""
Firebase Auth Service
Handles Firebase Admin initialization and token verification,
and provides a require_auth decorator for Flask routes.
"""

import os
import firebase_admin
from firebase_admin import credentials, auth
from functools import wraps
from flask import request, jsonify

class FirebaseAuthService:
    def __init__(self):
        self._initialized = False
        self.initialize_firebase()

    def initialize_firebase(self):
        """Initialize Firebase Admin SDK with service account credentials"""
        if self._initialized:
            return
        try:
            if not firebase_admin._apps:
                firebase_config = {
                    "type": "service_account",
                    "project_id": os.getenv("FLASK_FIREBASE_PROJECT_ID"),
                    "private_key_id": os.getenv("FLASK_FIREBASE_PRIVATE_KEY_ID"),
                    "private_key": os.getenv("FLASK_FIREBASE_PRIVATE_KEY", "").replace('\\n', '\n'),
                    "client_email": os.getenv("FLASK_FIREBASE_CLIENT_EMAIL"),
                    "client_id": os.getenv("FLASK_FIREBASE_CLIENT_ID"),
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                    "client_x509_cert_url": os.getenv("FLASK_FIREBASE_CLIENT_CERT_URL"),
                }
                if firebase_config["project_id"] and firebase_config["client_email"]:
                    cred = credentials.Certificate(firebase_config)
                    firebase_admin.initialize_app(cred)
                else:
                    firebase_admin.initialize_app()
            self._initialized = True
        except Exception as e:
            print(f"Error initializing Firebase Admin SDK (auth): {e}")
            self._initialized = False

    def verify_token(self, id_token):
        """Verify a Firebase ID token; return decoded token dict or None."""
        try:
            return auth.verify_id_token(id_token)
        except Exception as e:
            print(f"Error verifying token: {e}")
            return None

    def require_auth(self, f):
        """Decorator to require Firebase authentication for Flask routes"""
        @wraps(f)
        def decorated_function(*args, **kwargs):
            auth_header = request.headers.get('Authorization', '')
            if not auth_header.startswith('Bearer '):
                return jsonify({'error': 'Invalid authorization header'}), 401

            id_token = auth_header.split('Bearer ')[1]
            decoded_token = self.verify_token(id_token)

            if not decoded_token:
                return jsonify({'error': 'Invalid or expired token'}), 401

            request.user = decoded_token  # attach user info to request
            return f(*args, **kwargs)
        return decorated_function

# Prefer lazy singleton to avoid import-time side effects
_auth_service = None

def get_firebase_auth():
    global _auth_service
    if _auth_service is None:
        _auth_service = FirebaseAuthService()
    return _auth_service

# Convenience decorator export
def require_auth(f):
    return get_firebase_auth().require_auth(f)
