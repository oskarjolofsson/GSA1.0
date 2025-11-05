"""
Firebase Admin SDK Service
Handles Firebase authentication verification and Firestore operations for token management
"""

from firebase_admin import firestore
from services.firebase.firebase import FireBaseService;
import os
from dotenv import load_dotenv

class FireBaseTokens(FireBaseService):
    def __init__(self, user_id):
        load_dotenv()
        super().__init__(user_id)
        
        self.tokens_ref = self.db.collection('users').document(user_id).collection('tokens').document('token_balance')
        self.initialize_user_tokens()
        
    def get_user_tokens(self):
        snap = self.tokens_ref.get()
        return (snap.to_dict() or {}).get('tokens', 0)

    def initialize_user_tokens(self):
        if not self.tokens_ref.get().exists:
            self.tokens_ref.set({
                'tokens': 3,
                'createdAt': firestore.SERVER_TIMESTAMP,
                'lastUpdated': firestore.SERVER_TIMESTAMP
            })

    def spend_tokens(self, amount=1):
        assert amount > 0
        tx = self.db.transaction()

        @firestore.transactional
        def run(tx):
            snap = self.tokens_ref.get(transaction=tx)
            
            data = snap.to_dict() or {'tokens': 3}
            cur = int(data.get('tokens', 0))
            if cur < amount:
                return False, cur, "Insufficient tokens"
            tx.update(self.tokens_ref, {
                'tokens': cur - amount,
                'lastUpdated': firestore.SERVER_TIMESTAMP
            })
            return True, cur - amount, "OK"

        return run(tx)

    def add_tokens(self, amount):
        assert amount > 0
        # atomic increment (creates doc if merge=True + missing)
        
        self.tokens_ref.set({
            'tokens': firestore.Increment(amount),
            'lastUpdated': firestore.SERVER_TIMESTAMP
        }, merge=True)
        return self.get_user_tokens()

    def add_tokens_based_on_priceid(self, price_id: str) -> int:
        price_to_tokens = {
            os.getenv("PRICE_ID_PLAYER_MONTHLY"): 10,
            os.getenv("PRICE_ID_PLAYER_YEARLY"): 120,
            os.getenv("PRICE_ID_PRO_MONTHLY"): 30,
            os.getenv("PRICE_ID_PRO_YEARLY"): 360,
        }
        if not price_to_tokens.get(price_id):
            # TODO send some warning to monitoring service?
            raise ValueError(f"Unknown price_id: {price_id}")

        print(f"Adding {price_to_tokens.get(price_id, 0)} tokens for price_id {price_id}")
        self.add_tokens(price_to_tokens.get(price_id, 0))