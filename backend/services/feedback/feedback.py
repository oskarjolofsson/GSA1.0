from services.firebase.firebase_feedback import FirebaseFeedback

class FeedbackService:

    def save_feedback(self, user_id, rating, comments):
        feedback_service = FirebaseFeedback(user_id=user_id)
        feedback_service.submit_feedback(rating=rating, comment=comments)
        
        # Process the feedback (e.g., analyze, store, etc.)
        feedback = {
            "userId": user_id,
            "rating": rating,
            "comment": comments,
        }
        self.process_feedback(feedback)

    def process_feedback(self, feedback):
        # Logic to process feedback (e.g., analyze sentiment, generate reports)
        # Not implemented yet
        pass