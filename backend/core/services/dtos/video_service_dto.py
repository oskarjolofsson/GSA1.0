from dataclasses import dataclass
from uuid import UUID
from datetime import datetime, timedelta
from typing import Optional


@dataclass
class VideoResponseDTO:
    """Response DTO for video data."""
    id: UUID
    user_id: UUID
    video_key: Optional[str]
    start_time: Optional[timedelta]
    end_time: Optional[timedelta]
    camera_view: Optional[str]
    club_type: Optional[str]
    created_at: datetime
    updated_at: datetime


@dataclass
class VideoUrlResponseDTO:
    """Response DTO for video URL."""
    video_url: str

