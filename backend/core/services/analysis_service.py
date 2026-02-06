from .dtos.analysis_service_dto import CreateAnalysisDTO, RunAnalysisDTO

# Infrastructure imports 
from ..infrastructure.storage.r2Adaptor import generate_upload_url
from ..infrastructure.db.repositories.analysis import create_analysis as create_analysis_in_db, get_analysis_by_id, update_analysis
from ..infrastructure.db.repositories.videos import create_video, update_video, get_video_by_id
from ..infrastructure.db.models.Analysis import Analysis
from ..infrastructure.db.models.Video import Video
from ..infrastructure.storage.r2Adaptor import get_object
from ..infrastructure.local_files.file_types.Video_file import Video_file
from ..infrastructure.db.session import SessionLocal

db_session = SessionLocal()

def create_analysis(dto: CreateAnalysisDTO): 
    video: Video = Video(
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
    analysis: Analysis = create_analysis_in_db(analysis=analysis, session=db_session)
    
    video_key = f"videos/{video.id}"
    video.video_key = video_key
    update_video(video=video, session=db_session)
    
    upload_url = generate_upload_url(key=video_key)
    
    db_session.commit()
    
    return {
        "analysis_id": analysis.id,
        "upload_url": upload_url
    }


def run_analysis(dto: RunAnalysisDTO): 
    # Check that analysis exists and is in correct state by getting that analysis object from the database with the analysis_id
    analysis_object: Analysis = get_analysis_by_id(dto.analysis_id)
    if analysis_object is None or analysis_object.status != 'awaiting_upload':
        raise ValueError("Analysis not found or not in correct state to run.")
    
    # Set processing state on analysis object
    analysis_object.status = 'processing'
    analysis_object = update_analysis(analysis=analysis_object, session=db_session)
    
    # Download the video from R2 using the video_key in analysis, and save it to a temporary location
    video_object: Video = get_video_by_id(analysis_object.video_id, session=db_session)
    video_data: bytes = get_object(video_object.video_key)
    video_file = Video_file(f=video_data)
    
    # Start analysis process
    
    # Insert analysis_issues and analysis_drills that are found in the analysis_results_object
    
    # Set completed state on analysis object
    
    # Commit to db
    
    # Return the analysis_results_object, that contains the id of issues and drills 
    
    
def get_analysis_by_id(analysis_id: int): ...
    # Prompt the database for the analysis with the given id, and return that analysis object


def get_analyses_by_user_id(user_id: str): ...
    # Prompt the database for all analyses that belong to the user with the given user_id, and return a list of those analysis objects


def delete_analysis(analysis_id: int): ...
    # Prompt the database to delete the analysis with the given id
    

def get_analysis_issues(analysis_id: int): ...
    # Prompt the database for all analysis issues that belong to the analysis with the given analysis_id, and return a list of those analysis issue objects


def delete_analysis_issue(analysis_issue_id: int): ...
    # Prompt the database to delete the analysis issue with the given id


def get_analysis_drills(analysis_id: int): ...
    # Prompt the database for all analysis drills that belong to the analysis with the given analysis_id, and return a list of those analysis drill objects
    
    
def delete_analysis_drill(analysis_drill_id: int): ...
    # Prompt the database to delete the analysis drill with the given id
