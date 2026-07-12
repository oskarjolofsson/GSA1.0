import os
from typing import Optional
from dotenv import load_dotenv
from google import genai

from ..ports import AnalysisAI
from . import videoAnalyzer
from . import feedbackStructurer
from uuid import UUID




class GoogleAnalysisClient(AnalysisAI):
    """Google Gemini-based video analysis client."""
    
    def __init__(self):
        """Initialize the Gemini client with API key from environment."""
        load_dotenv()
        api_key = os.getenv("GEMINI_API_KEY")
        
        if not api_key:
            raise EnvironmentError("GEMINI_API_KEY environment variable not set.")
        
        self.client = genai.Client(api_key=api_key)
    
    def analyze_video(
        self,
        video_path: str,
        user_id: Optional[UUID] = None,
        shape: Optional[str] = None,
        height: Optional[str] = None,
        misses: Optional[str] = None,
        extra: Optional[str] = None,
        model: str = None,
        db_session: Optional[object] = None
    ) -> dict:
        """
        Analyze a golf swing video.

        Args:
            video_path: Local path to the video file
            shape: Wanted ball shape (optional)
            height: Wanted ball height (optional)
            misses: Actual result/miss pattern (optional)
            extra: Additional user notes (optional)
            model: Model identifier to run with. Required — there is no default;
                callers resolve it via model_selection.get_active_analysis_model().

        Returns:
            dict: Analysis results
        """
        return videoAnalyzer.analyze_video(
            client=self.client,
            video_path=video_path,
            user_id=user_id,
            shape=shape,
            height=height,
            misses=misses,
            extra=extra,
            model=model,
            db_session=db_session
        )

    def structure_coach_feedback(
        self,
        text: str,
        model: str,
        image_bytes: Optional[bytes] = None,
        image_mime: Optional[str] = None,
    ) -> dict:
        """Format coach lesson feedback into a draft Issue + Drills. See
        feedbackStructurer for the formatting-only contract."""
        return feedbackStructurer.structure_coach_feedback(
            client=self.client,
            text=text,
            model=model,
            image_bytes=image_bytes,
            image_mime=image_mime,
        )
