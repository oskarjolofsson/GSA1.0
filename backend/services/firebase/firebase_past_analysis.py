from services.firebase.firebase import FireBaseService
from services.firebase.firebase_stripe import FirebaseStripeService
from firebase_admin import firestore
import os
from dotenv import load_dotenv

load_dotenv()

class FireBasePastAnalysis(FireBaseService):
    def __init__(self, user_id: str, sport: str):
        super().__init__(user_id=user_id)
        self.sport = sport
        self.analyses_ref = (self.db.
                        collection('users').
                        document(user_id).
                        collection('past_analysis').
                        document(sport).
                        collection('analyses'))

    def add_analysis(self, analysis_data: dict):
        """
        Adds a new analysis document.
        """
        # Add metadata
        data = analysis_data.copy()
        data.update({
            "sport": self.sport,
            "createdAt": firestore.SERVER_TIMESTAMP,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        })
        
        self.analyses_ref.add(data)

    def get_analyses(self, limit: int = None) -> list[dict]:
        query = self.analyses_ref.order_by("createdAt", direction=firestore.Query.DESCENDING)
        if limit:
            query = query.limit(limit)
        return [d.to_dict() | {"id": d.id} for d in query.stream()]
    
    def get_analyses_by_tier(self) -> list[dict]:
        """Get analyses based on user's subscription tier.
        Player tier users get last 5 analyses, Pro tier gets all analyses."""
        # Check user's subscription tier
        stripe_service = FirebaseStripeService(self.user_id)
        user_stripe_info = stripe_service.db_get_user()
        price_id = user_stripe_info.get('stripe_price_id', '')
        
        # Player tier price IDs from environment
        player_price_ids = [
            os.getenv('PRICE_ID_PLAYER_MONTHLY'),
            os.getenv('PRICE_ID_PLAYER_YEARLY')
        ]
        
        if not price_id:
            # No subscription, return empty list
            return []
        
        # If user has player plan, limit to last 5 analyses
        limit = 5 if price_id in player_price_ids else None
        return self.get_analyses(limit=limit)
