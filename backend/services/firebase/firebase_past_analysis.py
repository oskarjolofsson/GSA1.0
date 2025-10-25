from services.firebase.firebase import FireBaseService
from firebase_admin import firestore

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

    def get_drills(self) -> list[dict]:
        col = self.doc_ref
        return [d.to_dict() | {"id": d.id} for d in col.order_by("createdAt", direction=firestore.Query.DESCENDING).stream()]
