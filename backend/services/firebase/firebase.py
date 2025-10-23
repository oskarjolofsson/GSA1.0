import os
import firebase_admin
from firebase_admin import credentials, firestore

class FireBaseService:
    def __init__(self):
        self._initialized = False
        self.db = None
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

            self.db = firestore.client()
            
            self._initialized = True
        except Exception as e:
            print(f"Error initializing Firebase Admin SDK (auth): {e}")
            self._initialized = False