from services.firebase.firebase import FireBaseService
from google.cloud import firestore
from google.cloud.firestore import Query


class FireBaseAnalyses(FireBaseService):
    def __init__(self, user_id: str, sport="golf"):
        super().__init__(user_id=user_id)
        self.sport = sport
        self.analyses_ref = self.db.collection("analyses")

    def save_analysis(
        self, analysis_id: str, details: dict, video_key: str, video_data: dict
    ) -> str:
        """
        Save an analysis document by its ID.
        Called when creating a new analysis, before processing starts.
        """
        data = {
            "analysis_id": analysis_id,
            "user_id": self.user_id,
            "sport": self.sport,
            "status": "awaiting_upload",
            "prompts": details,
            "video_key": video_key,
            "video": video_data,
            "analysis_results": {},
            "viewers": [],
            "error_message": "",
            "createdAt": firestore.SERVER_TIMESTAMP,
            "startedAt": None,
            "completedAt": None,
        }

        doc_ref = self.analyses_ref.document(analysis_id)
        doc_ref.set(data, merge=True)
        return doc_ref.id

    def get_analysis_by_id(self, analysis_id: str) -> dict:
        """
        Retrieve an analysis document by its ID.
        """
        doc_ref = self.analyses_ref.document(analysis_id)
        doc = doc_ref.get()
        if doc.exists:
            return doc.to_dict()
        else:
            return None

    def list_analyses_for_user(self, limit: int = 10):
        """
        List analyses for the authenticated user, most recent first.
        """
        query = (
            self.analyses_ref.where("user_id", "==", self.user_id)
            .order_by("createdAt", direction=Query.DESCENDING)
            .limit(limit)
        )

        docs = query.stream()

        analyses = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            analyses.append(data)

        return analyses

    def list_analysis_ids_for_user(self, limit: int = 10):
        """
        List analysis IDs for the authenticated user, most recent first.
        """
        analyses = self.list_analyses_for_user(limit=limit)

        key_findings = analyses[0].get("analysis_results", {}).get("key_findings", [])
        titles = [finding.get("title") for finding in key_findings]
        print("Analyses-titles:", titles)

        return_list = [
            {
                "analysis_id": analysis["analysis_id"],
                "createdAt": analysis.get("createdAt"),
                "video_key": analysis.get("video_key", ""),
                "title": titles[0] if 0 < len(titles) else "Untitled Analysis",
            }
            for analysis in analyses
        ]

        return return_list

    def update_analysis(self, analysis_id: str, update_data: dict) -> None:
        """
        Update an analysis document with new data.
        """
        doc_ref = self.analyses_ref.document(analysis_id)
        doc_ref.update(update_data)

    def set_processing(self, analysis_id: str) -> None:
        """
        Set analysis status to processing and record startedAt timestamp.
        """
        self.update_analysis(
            analysis_id=analysis_id,
            update_data={
                "status": "processing",
                "startedAt": firestore.SERVER_TIMESTAMP,
            },
        )

    def set_completed(self, analysis_id: str, results: dict) -> None:
        """
        Set analysis status to completed, save results, and record completedAt timestamp.
        """
        self.update_analysis(
            analysis_id=analysis_id,
            update_data={
                "status": "completed",
                "analysis_results": results,
                "completedAt": firestore.SERVER_TIMESTAMP,
            },
        )

    def set_failed(self, analysis_id: str, error_message: str) -> None:
        """
        Set analysis status to failed and save error message.
        """
        self.update_analysis(
            analysis_id=analysis_id,
            update_data={
                "status": "failed",
                "error_message": error_message,
                "completedAt": firestore.SERVER_TIMESTAMP,
            },
        )

    def mark_user_as_viewer(self, analysis_id: str, viewer_user_id: str) -> None:
        """
        Mark a user as a viewer of the analysis.
        """
        doc_ref = self.analyses_ref.document(analysis_id)
        doc = doc_ref.get()
        if doc.exists:
            analysis_data = doc.to_dict()
            if viewer_user_id == analysis_data.get("user_id"):
                return  # Owner is not added as viewer
            viewers = analysis_data.get("viewers", [])
            if viewer_user_id not in viewers:
                viewers.append(viewer_user_id)
                doc_ref.update({"viewers": viewers})

    def delete_analysis(self, analysis_id: str) -> None:
        """
        Delete an analysis document by its ID.
        """
        doc_ref = self.analyses_ref.document(analysis_id)
        doc_ref.delete()


def firebase_analyses(user_id: str, sport="golf") -> FireBaseAnalyses:
    return FireBaseAnalyses(user_id=user_id, sport=sport)
