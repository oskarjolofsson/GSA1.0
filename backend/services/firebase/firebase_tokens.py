"""
Firebase Admin SDK Service
Handles Firebase authentication verification and Firestore operations for token management
"""

from firebase_admin import auth, firestore
from datetime import datetime
from services.firebase.firebase import FireBaseService;

class FireBaseTokens(FireBaseService):
    def __init__(self, user_id):
        super().__init__(user_id)
        
        self.tokens_ref = self.db.collection('users').document(user_id).collection('tokens').document('init')

    def get_user_tokens(self):
        user_ref = self.db.collection('users').document(self.user_id)
        user_doc = user_ref.get()
        
        if user_doc.exists:
            return user_doc.to_dict().get('tokens', 0)
        else:
            # Initialize user with 3 tokens if they don't exist
            self.initialize_user_tokens(self.user_id)
            return 3
    
    def initialize_user_tokens(self):
        tokens_ref = self.db.collection('users').document(self.user_id).collection('tokens').document('init')
        doc = tokens_ref.get()

        if not doc.exists:
            tokens_ref.set({
                'tokens': 3,
                'createdAt': datetime.now().isoformat(),
                'lastUpdated': datetime.now().isoformat()
            })

    def spend_tokens(self, amount=1):
        user_ref = self.db.collection('users').document(self.user_id)
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
            

    def add_tokens(self, amount):
        user_ref = self.db.collection('users').document(self.user_id)
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