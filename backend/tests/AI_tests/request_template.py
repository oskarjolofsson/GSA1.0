"""Request templates for API testing."""

from pathlib import Path
from typing import Dict, Any, Optional


class RequestTemplate:
    """Template for creating API requests with customizable inputs."""

    def __init__(self, base_dir: Path, video_filename = "test_video.mp4"):
        """Initialize the request template.
        
        Args:
            base_dir: Base directory for test files.
        """
        self.base_dir = base_dir
        self.test_video_path = base_dir / "tests" / "AI_tests" / video_filename

    def create_upload_video_request(
        self,
        model: str,
        note: str = "",
        start_time: str = "0",
        end_time: str = "2",
        user_id: str = "8oAXCb0Th2OohAOy96kFT3zMeCC2",
    ) -> Dict[str, Any]:
        """Create an upload video request.
        
        Args:
            model: AI model to use for analysis.
            note: Optional note about the video.
            start_time: Start time in seconds.
            end_time: End time in seconds.
            user_id: User ID for the request.
            
        Returns:
            Dictionary containing the request data and file handle.
        """
        video_file = open(self.test_video_path, "rb")
        
        data = {
            "video": (video_file, "test_video.mp4"),
            "note": note,
            "start_time": start_time,
            "end_time": end_time,
            "user_id": user_id,
            "model": model,
        }
        
        return {
            "data": data,
            "file_handle": video_file,
        }

    def create_default_upload_video_request(self, model: str) -> Dict[str, Any]:
        """Create a default upload video request with standard parameters.
        
        Args:
            model: AI model to use for analysis.
            
        Returns:
            Dictionary containing the request data and file handle.
        """
        return self.create_upload_video_request(model=model)

    @staticmethod
    def get_upload_video_endpoint() -> str:
        """Get the upload video endpoint path.
        
        Returns:
            The endpoint path.
        """
        return "/api/v1/analysis/upload_video"

    @staticmethod
    def get_request_method() -> str:
        """Get the HTTP method for upload requests.
        
        Returns:
            The HTTP method (POST).
        """
        return "POST"

    @staticmethod
    def get_content_type() -> str:
        """Get the content type for upload requests.
        
        Returns:
            The content type for multipart form data.
        """
        return "multipart/form-data"
