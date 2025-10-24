

from services.firebase.firebase import FireBaseService


class FireBasePastAnalysis(FireBaseService):
    def __init__(self, user_id: str):
        super().__init__(user_id=user_id)

    def log_past_drills(self, drill_data: list[str]) -> None:
        """
        Log past drill data for a user
        Args:
            drill_data: A list of drill data to log, String
        Returns:
            None
        """
        if not self.db:
            raise Exception("Firestore not initialized")
    
        analysis_ref = self.db.collection('users').document(self.user_id).collection('past_drills')
        for drill in drill_data:
            analysis_ref.add(drill)

    def get_past_drills(self) -> list[dict]:
        """
        Retrieve past drills for a user
        
        Args:
            user_id: The Firebase user ID

        Returns:
            list: A list of past drill documents or an empty list if none found
        """
        if not self.db:
            raise Exception("Firestore not initialized")

        analysis_ref = self.db.collection('users').document(self.user_id).collection('past_drills')
        return [doc.to_dict() for doc in analysis_ref.stream()] or []