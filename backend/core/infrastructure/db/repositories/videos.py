from ..models.Video import Video
from sqlalchemy import select
from sqlalchemy.orm import Session

def get_video_by_id(video_id, session: Session) -> Video:
    return session.get(Video, video_id)
    

def get_video_by_user_id(user_id, session: Session) -> Video:
    stmt = (
        select(Video)
        .where(Video.user_id == user_id)
    )
    
    return session.scalars(stmt).first()
    
    
def create_video(video: Video, session: Session) -> Video:
    session.add(video)
    session.flush()
    return video


def update_video(video: Video, session: Session) -> Video:
    session.add(video)
    session.flush()
    return video