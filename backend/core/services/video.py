from sqlalchemy.orm import Session
from uuid import UUID

from core.infrastructure.db.repositories.videos import (
    get_video_by_id as repo_get_video_by_id,
    get_video_by_analysis_id as repo_get_video_by_analysis_id,
    get_videos_by_analysis_ids as repo_get_videos_by_analysis_ids,
    delete_video as repo_delete_video,
)
from core.infrastructure.db.models.Video import Video
from core.infrastructure.db.session import SessionLocal
from core.infrastructure.storage.r2Adaptor import generate_read_url
from .exceptions import NotFoundException
from .dtos.video_service_dto import VideoResponseDTO, VideoUrlResponseDTO, VideoThumbnailListResponseDTO


def get_video_by_id(video_id: UUID, db_session: Session) -> VideoResponseDTO:
    """Get a video by its ID."""
    video = repo_get_video_by_id(video_id, db_session)
    
    if not video:
        raise NotFoundException("Video", str(video_id))
    
    return from_video_to_response_dto(video)


def get_video_read_url_by_analysis(analysis_id: UUID, db_session: Session) -> VideoUrlResponseDTO:
    """Get a signed read URL for a video by analysis ID."""
    video = repo_get_video_by_analysis_id(analysis_id, db_session)
    if not video:
        raise NotFoundException("Video", f"for analysis {analysis_id}")
    
    if not video.video_key:
        raise NotFoundException("Video key", f"for analysis {analysis_id}")
    
    video_url = generate_read_url(video.video_key)
    return VideoUrlResponseDTO(video_url=video_url)


def get_video_thumbnail_urls_from_analyses(analysis_ids: list[UUID], db_session: Session) -> VideoThumbnailListResponseDTO:
    videos: list[Video] = repo_get_videos_by_analysis_ids(analysis_ids, db_session)
    thumbnail_urls = {}
    for video in videos:
        if video.thumbnail_key:
            url: str = generate_read_url(video.thumbnail_key)
            thumbnail_urls[video.id] = url
    return VideoThumbnailListResponseDTO(thumbnail_urls=thumbnail_urls)


def delete_video(video_id: UUID, db_session: Session) -> None:
    """Delete a video by its ID."""
    video = repo_get_video_by_id(video_id, db_session)
    
    if not video:
        raise NotFoundException("Video", str(video_id))
    
    repo_delete_video(video_id, db_session)


def from_video_to_response_dto(video: Video) -> VideoResponseDTO:
    """Convert Video model to VideoResponseDTO."""
    return VideoResponseDTO(
        id=video.id,
        user_id=video.user_id,
        video_key=video.video_key,
        start_time=video.start_time,
        end_time=video.end_time,
        camera_view=video.camera_view,
        club_type=video.club_type,
        created_at=video.created_at,
        updated_at=video.updated_at,
    )
