from .dtos.create_analysis_dto import CreateAnalysisDTO

# Infrastructure imports 
from ..infrastructure.storage.r2Adaptor import generate_upload_url
from ..infrastructure.db.repositories.analysis import create_analysis as create_analysis_in_db
from ..infrastructure.db.repositories.videos import create_video, update_video
from ..infrastructure.db.models.Analysis import Analysis
from ..infrastructure.db.models.Video import Video

from ..infrastructure.db.session import SessionLocal

db_session = SessionLocal()

def create_analysis(dto: CreateAnalysisDTO): 
    video = Video(
        user_id=dto.user_id,
        start_time=dto.start_time,
        end_time=dto.end_time
    )
    video = create_video(video=video, session=db_session)
    
    analysis = Analysis(
        user_id=dto.user_id,
        model_version=dto.model, 
        video_id=video.id
    )
    analysis = create_analysis_in_db(analysis=analysis, session=db_session)
    
    video_key = f"videos/{video.id}"
    video.video_key = video_key
    update_video(video=video, session=db_session)
    
    upload_url = generate_upload_url(key=video_key)
    
    db_session.commit()
    
    return {
        "analysis_id": analysis.id,
        "upload_url": upload_url
    }


def run_analysis(): ...


def get_analysis_by_id(analysis_id: int): ...


def get_analyses_by_user_id(user_id: str): ...


def delete_analysis(analysis_id: int): ...


def get_analysis_issues(analysis_id: int): ...


def delete_analysis_issue(analysis_issue_id: int): ...


def get_analysis_drills(analysis_id: int): ...
