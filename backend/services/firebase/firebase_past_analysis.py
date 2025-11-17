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
        self.doc_ref = (self.db.
                        collection('users').
                        document(user_id).
                        collection('past_analysis').
                        document(sport).
                        collection('drills'))

    def add_drills(self, drills: list[dict[str, str]]):
        col = self.doc_ref
        batch = self.db.batch()
        for drill in drills:
            ref = col.document()
            batch.set(ref, {
                "title": drill.get("drill-title", ""),
                "content": drill.get("drill-description", ""),
                "youtubeLink": drill.get("drill-youtube-video-link", ""),
                "sport": self.sport,
                "createdAt": firestore.SERVER_TIMESTAMP,
                "updatedAt": firestore.SERVER_TIMESTAMP,
                "editedBy": self.user_id,
            })
        batch.commit()
        
    def update_drill(self, drill_id: str, data: dict):
        ref = self.doc_ref.document(drill_id)
        data["updatedAt"] = firestore.SERVER_TIMESTAMP
        ref.set(data, merge=True)

    def get_drills(self, limit: int = None) -> list[dict]:
        col = self.doc_ref
        query = col.order_by("createdAt", direction=firestore.Query.DESCENDING)
        if limit:
            query = query.limit(limit)
        return [d.to_dict() | {"id": d.id} for d in query.stream()]
    
    def get_drills_by_tier(self) -> list[dict]:
        """Get drills based on user's subscription tier.
        Player tier users get last 5 drills, Pro tier gets all drills."""
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
        
        # If user has player plan, limit to last 5 drills
        limit = 5 if price_id in player_price_ids else None
        return self.get_drills(limit=limit)
