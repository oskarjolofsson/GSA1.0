from services.firebase.firebase import FireBaseService
from firebase_admin import firestore
from uuid import uuid4

class FirebaseDrillService(FireBaseService):
    
    def __init__(self, user_id: str):
        super().__init__(user_id=user_id)
        self.drills_ref = self.db.collection('drills')
        

    def add_drill(self, drill: str, analysis_id: str) -> str:
        """
        Adds a new drill document to the 'drills' collection.

        Args:
            drill (str): The drill content to be stored.

        Returns:
            str: The ID of the newly created drill document.
        """
        drill_id = f"drill_{uuid4()}"
        
        
        
        self.drills_ref.document(drill_id).set({
            "user_id": self.user_id,
            "analysis_id": analysis_id,
            "drill": drill,
            "drill_id": drill_id,
            "image_url": None,
        })
        
        return drill_id
    
    def update_drill_image(self, drill_id: str, image_url: str) -> None:
        """
        Updates the image URL of an existing drill document.

        Args:
            drill_id (str): The ID of the drill document to be updated.
            image_url (str): The new image URL to be set.
        """
        self.drills_ref.document(drill_id).update({
            "image_url": image_url
        })
        
    def extract_drill_from_analysis(self, analysis: dict, analysis_id: str) -> dict:
        """
        Extracts a drill from analysis data, returns analysis added with drill ID.

        Args:
            analysis (dict): The analysis data containing the drill information.

        Returns:
            dict: Analysis data with the drill ID included.
        """
        print("Extracting drill from analysis...")
        key_findings = analysis.get("key_findings", [])
        
        for finding in key_findings:
            drill_text = finding.get("try_this", "")
            if drill_text:
                drill_id = self.add_drill(drill=drill_text, analysis_id=analysis_id)
                finding["drill_id"] = drill_id
                
        return analysis
    
    def list_drills_for_user(self):
        docs = (
            self.drills_ref
            .where("user_id", "==", self.user_id)
            .stream()
        )

        return [

            {**doc.to_dict(), "id": doc.id}
            for doc in docs
        ]
    
    def list_drills_for_analysis(self, analysis_id: str):
        query = (
            self.drills_ref
            .where("user_id", "==", self.user_id)
            .where("analysis_id", "==", analysis_id)
        )

        docs = query.stream()

        drills = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            drills.append(data)

        return drills