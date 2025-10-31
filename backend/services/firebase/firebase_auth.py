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
from services.firebase.firebase import FireBaseService

class FirebaseAuthService(FireBaseService):
    def __init__(self, user_id=None):
        super().__init__(user_id=user_id)

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
                return jsonify({'error': 'Invalid authorization header: ' + auth_header}), 401

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
