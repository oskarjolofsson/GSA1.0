"""
Firebase Admin SDK Service
Handles Firebase authentication verification and Firestore operations for token management
"""

import firebase_admin
from firebase_admin import credentials, auth, firestore
import os
from functools import wraps
from flask import request, jsonify
from datetime import datetime
from google.api_core.exceptions import AlreadyExists

class FirebaseService:
    def __init__(self):
        """Initialize Firebase Admin SDK"""
        self.db = None
        self.initialize_firebase()
    
    def initialize_firebase(self):
        """Initialize Firebase Admin SDK with service account credentials"""
        try:
            # Check if Firebase Admin is already initialized
            if not firebase_admin._apps:
                # Option 1: Using service account JSON file (recommended for production)
                # Uncomment and use this if you have a service account key file
                # cred = credentials.Certificate('path/to/serviceAccountKey.json')
                
                # Option 2: Using environment variables
                # You'll need to set these in your .env file
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
                    "client_x509_cert_url": os.getenv("FLASK_FIREBASE_CLIENT_CERT_URL")
                }
                
                # Only initialize if we have the necessary environment variables
                if firebase_config["project_id"] and firebase_config["client_email"]:
                    cred = credentials.Certificate(firebase_config)
                    firebase_admin.initialize_app(cred)
                else:
                    # Option 3: Use default credentials (for Google Cloud environments)
                    firebase_admin.initialize_app()
            
            # Get Firestore client
            self.db = firestore.client()
            print("Firebase Admin SDK initialized successfully")
            
        except Exception as e:
            print(f"Error initializing Firebase Admin SDK: {e}")
            # Continue without Firebase if initialization fails
            # This allows the app to run even if Firebase is not configured
            self.db = None
    
    def verify_token(self, id_token):
        """
        Verify a Firebase ID token
        
        Args:
            id_token: The Firebase ID token from the client
            
        Returns:
            dict: Decoded token containing user information or None if invalid
        """
        try:
            decoded_token = auth.verify_id_token(id_token)
            return decoded_token
        except Exception as e:
            print(f"Error verifying token: {e}")
            return None
    
    def get_user_tokens(self, user_id):
        """
        Get the current token count for a user
        
        Args:
            user_id: The Firebase user ID
            
        Returns:
            int: Current token count
        """
        if not self.db:
            raise Exception("Firestore not initialized")
        
        try:
            user_ref = self.db.collection('users').document(user_id)
            user_doc = user_ref.get()
            
            if user_doc.exists:
                return user_doc.to_dict().get('tokens', 0)
            else:
                # Initialize user with 3 tokens if they don't exist
                self.initialize_user_tokens(user_id)
                return 3
        except Exception as e:
            print(f"Error getting user tokens: {e}")
            raise e
    
    def initialize_user_tokens(self, user_id):
        """
        Initialize tokens for a new user
        
        Args:
            user_id: The Firebase user ID
        """
        if not self.db:
            raise Exception("Firestore not initialized")
        
        try:
            user_ref = self.db.collection('users').document(user_id)
            user_ref.set({
                'tokens': 3,
                'createdAt': datetime.now().isoformat(),
                'lastUpdated': datetime.now().isoformat()
            })
        except AlreadyExists:
            print(f"Will not init {user_id}, already exists")
            return
        except Exception as e:
            print(f"Error initializing user tokens: {e}")
            raise e
    
    def spend_tokens(self, user_id, amount=1):
        """
        Spend tokens for a user (with verification)
        
        Args:
            user_id: The Firebase user ID
            amount: Number of tokens to spend
            
        Returns:
            tuple: (success: bool, remaining_tokens: int, message: str)
        """
        if not self.db:
            raise Exception("Firestore not initialized")
        
        try:
            user_ref = self.db.collection('users').document(user_id)
            
            # Use a transaction to ensure atomicity
            transaction = self.db.transaction()
            
            @firestore.transactional
            def update_in_transaction(transaction, user_ref, amount):
                snapshot = user_ref.get(transaction=transaction)
                
                if not snapshot.exists:
                    # Initialize user if they don't exist
                    transaction.set(user_ref, {
                        'tokens': 3,
                        'createdAt': datetime.now().isoformat(),
                        'lastUpdated': datetime.now().isoformat()
                    })
                    current_tokens = 3
                else:
                    current_tokens = snapshot.to_dict().get('tokens', 0)
                
                # Check if user has enough tokens
                if current_tokens < amount:
                    return False, current_tokens, "Insufficient tokens"
                
                # Update the token count
                new_token_count = current_tokens - amount
                transaction.update(user_ref, {
                    'tokens': new_token_count,
                    'lastUpdated': datetime.now().isoformat()
                })
                
                return True, new_token_count, "Tokens spent successfully"
            
            return update_in_transaction(transaction, user_ref, amount)
            
        except Exception as e:
            print(f"Error spending tokens: {e}")
            raise e
    
    def add_tokens(self, user_id, amount):
        """
        Add tokens to a user's account
        
        Args:
            user_id: The Firebase user ID
            amount: Number of tokens to add
            
        Returns:
            int: New token count
        """
        if not self.db:
            raise Exception("Firestore not initialized")
        
        try:
            user_ref = self.db.collection('users').document(user_id)
            user_doc = user_ref.get()
            
            if user_doc.exists:
                current_tokens = user_doc.to_dict().get('tokens', 0)
                new_tokens = current_tokens + amount
            else:
                new_tokens = 3 + amount  # Start with 3 tokens plus the added amount
            
            user_ref.set({
                'tokens': new_tokens,
                'lastUpdated': datetime.now().isoformat()
            }, merge=True)
            
            return new_tokens
        except Exception as e:
            print(f"Error adding tokens: {e}")
            raise e

# Create a singleton instance
firebase_service = FirebaseService()