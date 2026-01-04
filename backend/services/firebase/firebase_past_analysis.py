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
        Returns the document ID of the created analysis.
        """
        # Add metadata
        data = analysis_data.copy()
        data.update({
            "sport": self.sport,
            "createdAt": firestore.SERVER_TIMESTAMP,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        })
        
        doc_ref = self.analyses_ref.add(data)
        return doc_ref[1].id

    def get_analyses(self, limit: int = None, offset: int = 0) -> list[dict]:
        query = self.analyses_ref.order_by("createdAt", direction=firestore.Query.DESCENDING)
        if offset:
            query = query.offset(offset)
        if limit:
            query = query.limit(limit)
        return [d.to_dict() | {"id": d.id} for d in query.stream()]
    
    def get_analyses_by_tier(self, limit: int = 10, offset: int = 0) -> dict:
        """Get analyses with pagination.
        Returns dict with 'analyses' list and 'total' count."""
        
        # Get all analyses to get total count
        all_analyses = [d.to_dict() | {"id": d.id} for d in self.analyses_ref.order_by("createdAt", direction=firestore.Query.DESCENDING).stream()]
        total = len(all_analyses)
        
        # Get paginated analyses
        analyses = self.get_analyses(limit=limit, offset=offset)
        
        print(f"User {self.user_id} fetching analyses with offset={offset}, limit={limit}, total={total}")
        
        return {"analyses": analyses, "total": total}

    def get_analysis_by_id(self, analysis_id: str):
        """
        Fetch a single analysis by its document ID for the current user.
        """
        try:
            # Only query the current user's analyses
            doc = self.analyses_ref.document(analysis_id).get()
            if doc.exists:
                return doc.to_dict() | {"id": doc.id}
            
            # Not found
            return None
            
        except Exception as e:
            print(f"Error fetching analysis by ID {analysis_id}: {str(e)}")
            return None
