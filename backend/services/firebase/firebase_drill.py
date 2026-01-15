from services.firebase.firebase import FireBaseService
from firebase_admin import firestore
from uuid import uuid4

class FirebaseDrillService(FireBaseService):
    
    def __init__(self, user_id: str):
        super().__init__(user_id=user_id)
        self.drills_ref = self.db.collection('drills')
        

    def add_drill(self, task: str, fault_indicator: str, success_signal: str, analysis_id: str) -> str:
        """
        Adds a new drill document to the 'drills' collection.

        Args:
            drill (str): The drill content to be stored.

        Returns:
            str: The ID of the newly created drill document.
        """
        drill_id = "drill_" + str(uuid4())
        
        document_data = {
            "user_id": self.user_id,
            "analysis_id": analysis_id,
            "task": task,
            "fault_indicator": fault_indicator,
            "success_signal": success_signal,
            "drill_id": drill_id,
            "image_key": None,
            "createdAt": firestore.SERVER_TIMESTAMP,
        }
        
        self.drills_ref.document(drill_id).set(document_data)
        
        return drill_id
    
    def update_drill_image(self, drill_id: str, image_key: str) -> None:
        """
        Updates the image URL of an existing drill document.

        Args:
            drill_id (str): The ID of the drill document to be updated.
            image_key (str): The new image key to be set.
        """
        drill_doc_ref = self.drills_ref.document(drill_id)
        
        drill_doc_ref.update({
            "image_key": image_key
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
            task = finding.get("improve", {}).get("task", "")
            fault_indicator = finding.get("improve", {}).get("fault_indicator", "")
            success_signal = finding.get("improve", {}).get("success_signal", "")
            
            if task and fault_indicator and success_signal:
                drill_id = self.add_drill(task=task, fault_indicator=fault_indicator, success_signal=success_signal, analysis_id=analysis_id)
                finding["drill_id"] = drill_id
                
        return analysis
        
    def get_drill_by_id(self, drill_id: str) -> dict:
        """
        Retrieves a drill document by its ID.

        Args:
            drill_id (str): The ID of the drill document to retrieve.

        Returns:
            dict: The drill document data if found, otherwise None.
        """
        drill_doc = self.drills_ref.document(drill_id).get()
        if drill_doc.exists:
            return drill_doc.to_dict()
        else:
            return None
                
    def delete_drill(self, drill_id: str) -> None:
        """
        Deletes a drill document by its ID.

        Args:
            drill_id (str): The ID of the drill document to delete.
        """
        drill_doc_ref = self.drills_ref.document(drill_id)
        drill_doc_ref.delete()