from services.firebase.firebase import FireBaseService
from firebase_admin import firestore

class FirebaseFeedback(FireBaseService):
    def __init__(self, user_id: str):
        super().__init__(user_id=user_id)
        self.user_id = user_id
        self.feedback_ref = self.db.collection('feedback')

    def submit_feedback(self, rating: int, comment: str) -> None:
        feedback_data = {
            "userId": self.user_id,
            "rating": rating,
            "comment": comment,
            "createdAt": firestore.SERVER_TIMESTAMP,
        }
        
        # Create a new feedback document
        self.feedback_ref.add(feedback_data)
        
    def get_user_feedback(self) -> list[dict]:
        pass