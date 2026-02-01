from ..models.Video import Video
from ..session import SessionLocal
from sqlalchemy import select

def get_video_by_id(video_id) -> Video:
    with SessionLocal() as session:
        return session.get(Video, video_id)
    

def get_video_by_user_id(user_id) -> Video:
    with SessionLocal() as session:
        stmt = (
            select(Video)
            .where(Video.user_id == user_id)
        )
        
        return session.scalars(stmt).first()
    
    
def create_video(video: Video) -> Video:
    with SessionLocal() as session:
        try:
            session.add(video)
            session.commit()
            session.refresh(video)
            return video
        except Exception:
            session.rollback()
            raise