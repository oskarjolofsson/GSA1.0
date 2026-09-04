
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
        model: str = None
    ) -> dict:
        """Analyze a golf swing video and return issues, key findings and metadata.

        `model` is required and provider-specific. Implementations must reject a missing model
        rather than fall back to a default.
        """
        ...