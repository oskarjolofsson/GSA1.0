

from services.firebase.firebase import FireBaseService


class FireBasePastAnalysis(FireBaseService):
    def __init__(self):
        super().__init__()

    def log_past_drills(self, user_id, drill_data):
        """
        Log past drill data for a user
        Args:
            user_id: The Firebase user ID
            drill_data: A dictionary containing drill details
            
        Returns:
            bool: True if logging was successful, False otherwise
        """
        if not self.db:
            raise Exception("Firestore not initialized")
    
        analysis_ref = self.db.collection('users').document(user_id).collection('past_drills')
        analysis_ref.add(drill_data)

    def get_past_drills(self, user_id):
        """
        Retrieve past drills for a user
        
        Args:
            user_id: The Firebase user ID

        Returns:
            list: A list of past drill documents or an empty list if none found
        """
        if not self.db:
            raise Exception("Firestore not initialized")

        analysis_ref = self.db.collection('users').document(user_id).collection('past_drills')
        return [doc.to_dict() for doc in analysis_ref.stream()] or []
        
        

# Create a singleton instance
firebase_past_analysis = FireBasePastAnalysis()