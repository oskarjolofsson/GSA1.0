from ..models.Video import Video
from ..models.Analysis import Analysis
from sqlalchemy import select
from sqlalchemy.orm import Session
from uuid import UUID


# ------------ GET ------------


def get_video_by_id(video_id: UUID, session: Session) -> Video:
    """Get a video by its ID."""
    return session.get(Video, video_id)


def get_video_by_analysis_id(analysis_id: UUID, session: Session) -> Video:
    """Get a video by its associated analysis ID."""
    stmt = (
        select(Video)
        .join(Analysis, Video.id == Analysis.video_id)
        .where(Analysis.id == analysis_id)
    )
    return session.scalars(stmt).first()


def get_video_by_user_id(user_id: UUID, session: Session) -> Video:
    """Get the first video for a user."""
    stmt = select(Video).where(Video.user_id == user_id)
    return session.scalars(stmt).first()


def get_videos_by_user_id(user_id: UUID, session: Session) -> list[Video]:
    """Get all videos for a user."""
    stmt = select(Video).where(Video.user_id == user_id).order_by(Video.created_at.desc())
    return session.scalars(stmt).all()


def get_videos_by_analysis_ids(analysis_ids: list[UUID], session: Session) -> list[Video]:
    """Get all videos associated with the given analysis IDs."""
    stmt = (
        select(Video)
        .join(Analysis, Video.id == Analysis.video_id)
        .where(Analysis.id.in_(analysis_ids))
    )
    return session.scalars(stmt).all()


# ------------ CREATE ------------


def create_video(video: Video, session: Session) -> Video:
    """Create a new video."""
    session.add(video)
    session.flush()
    return video


# ------------ UPDATE ------------


def update_video(video: Video, session: Session) -> Video:
    """Update an existing video."""
    session.add(video)
    session.flush()
    return video


def update_video_thumbnail_key(video_id: UUID, thumbnail_key: str, session: Session) -> Video:
    """Update the thumbnail key for a video."""
    video = session.get(Video, video_id)
    if video:
        video.thumbnail_key = thumbnail_key
        session.flush()
    return video


# ------------ DELETE ------------


def delete_video(video_id: UUID, session: Session) -> None:
    """Delete a video by its ID."""
    video = session.get(Video, video_id)
    if video:
        session.delete(video)
        session.flush()
