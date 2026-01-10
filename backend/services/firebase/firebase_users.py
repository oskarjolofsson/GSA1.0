from services.firebase.firebase import FireBaseService
from google.cloud import firestore

class FirebaseUsersService(FireBaseService):
    
    def __init__(self, user_id: str):
        super().__init__(user_id=user_id)
        self.users_ref = self.db.collection('users')
        
    def get_user_by_id(self) -> dict:
        """
        Retrieve a user document by its ID.
        """
        doc_ref = self.users_ref.document(self.user_id)
        doc = doc_ref.get()
        if doc.exists:
            return doc.to_dict()
        else:
            return None
        
    def update_user(self, user_data: dict) -> None:
        """
        Create or update a user document with new data.
        """
        
        base_data = {
            "updatedAt": firestore.SERVER_TIMESTAMP,
        }
        base_data.update(user_data)
        
        doc_ref = self.users_ref.document(self.user_id)
        doc_ref.set(base_data, merge=True)
        
    def create_user(self, email: str, name: str) -> None:
        """
        Create a new user document.
        """
        # Check if user already exists
        existing_user = self.get_user_by_id()
        if existing_user:
            return  # User already exists, do nothing
        
        data = {
            "user_id": self.user_id,
            "name": name,
            "email": email,
            "consent": False,
            "createdAt": firestore.SERVER_TIMESTAMP,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        }
        
        doc_ref = self.users_ref.document(self.user_id)
        doc_ref.set(data)
        
        
