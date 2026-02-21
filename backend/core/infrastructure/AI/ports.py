
from typing import Protocol, Optional


class AnalysisAI(Protocol):
    """Protocol for AI video analysis providers."""
    
    def analyze_video(
        self,
        video_path: str,
        shape: Optional[str] = None,
        height: Optional[str] = None,
        misses: Optional[str] = None,
        extra: Optional[str] = None,
        model: Optional[str] = None
    ) -> dict:
        """
        Analyze a golf swing video.
        
        Args:
            video_path: Local path to the video file
            shape: Wanted ball shape (optional)
            height: Wanted ball height (optional)  
            misses: Actual result/miss pattern (optional)
            extra: Additional user notes (optional)
            model: Model identifier (optional, provider-specific)
        
        Returns:
            dict: Analysis results containing issues, key findings, and metadata
        """
        ...