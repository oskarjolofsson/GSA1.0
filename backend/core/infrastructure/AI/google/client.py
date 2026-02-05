import os
from typing import Optional
from dotenv import load_dotenv
from google import genai

from ..ports import AnalysisAI
from . import videoAnalyzer


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
        shape: Optional[str] = None,
        height: Optional[str] = None,
        misses: Optional[str] = None,
        extra: Optional[str] = None,
        model: str = "gemini-3-flash-preview"
    ) -> dict:
        """
        Analyze a golf swing video.
        
        Args:
            video_path: Local path to the video file
            shape: Wanted ball shape (optional)
            height: Wanted ball height (optional)
            misses: Actual result/miss pattern (optional)
            extra: Additional user notes (optional)
            model: Gemini model to use (default: gemini-3-flash-preview)
        
        Returns:
            dict: Analysis results
        """
        return videoAnalyzer.analyze_video(
            client=self.client,
            video_path=video_path,
            shape=shape,
            height=height,
            misses=misses,
            extra=extra,
            model=model
        )
