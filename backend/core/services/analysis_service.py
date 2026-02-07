from .dtos.analysis_service_dto import CreateAnalysisDTO, RunAnalysisDTO, AnalysisResponseDTO, AnalysisResultsDTO

# Infrastructure imports 
from ..infrastructure.storage.r2Adaptor import generate_upload_url
from ..infrastructure.db.repositories.analysis import create_analysis as create_analysis_in_db, get_analysis_by_id as get_analysis_by_id_in_db, update_analysis
from ..infrastructure.db.repositories.videos import create_video, update_video, get_video_by_id
from ..infrastructure.db.models.Analysis import Analysis
from ..infrastructure.db.models.Video import Video
from ..infrastructure.db.repositories.analysis_issues import create_analysis_issue
from ..infrastructure.db.models.AnalysisIssue import AnalysisIssue

from ..infrastructure.storage.r2Adaptor import get_object
from ..infrastructure.local_files.file_types.Video_file import Video_file
from ..infrastructure.db.session import SessionLocal

from ..infrastructure.AI.google.client import GoogleAnalysisClient
from ..infrastructure.AI.google.videoAnalyzer import analyze_video

db_session = SessionLocal()

def create_analysis(dto: CreateAnalysisDTO): 
    analysis = None
    try:
        video: Video = Video(
            user_id=dto.user_id,
            start_time=dto.start_time,
            end_time=dto.end_time
        )
        video = create_video(video=video, session=db_session)
        
        analysis = Analysis(
            user_id=dto.user_id,
            model_version=dto.model, 
            video_id=video.id,
            status='awaiting_upload'
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
    except Exception as e:
        if analysis:
            analysis.error_message = str(e)
            analysis.success = False
            update_analysis(analysis=analysis, session=db_session)
            db_session.commit()
        raise


def run_analysis(dto: RunAnalysisDTO): 
    # Check that analysis exists and is in correct state by getting that analysis object from the database with the analysis_id
    analysis_object: Analysis = get_analysis_by_id_in_db(analysis_id=dto.analysis_id, session=db_session)
    if analysis_object is None or analysis_object.status != 'awaiting_upload':
        raise ValueError("Analysis not found or not in correct state to run.")
    
    try:
        # Set processing state on analysis object
        analysis_object.status = 'processing'
        analysis_object = update_analysis(analysis=analysis_object, session=db_session)
        
        # Download the video from R2 using the video_key in analysis, and save it to a temporary location
        video_object: Video = get_video_by_id(analysis_object.video_id, session=db_session)
        print(f"Video key: {video_object.video_key}")
        video_data: bytes = get_object(video_object.video_key)
        video_file = Video_file(f=video_data)
        
        # Start analysis process
        
        analysis_results: dict = analyze_video(  # TODO : handle client and prompts properly
            client=GoogleAnalysisClient().client,
            video_path=video_file.path(),           
            shape=None,
            height=None,
            misses=None,
            extra=None,
            model=analysis_object.model_version,
            db_session=db_session
        )
        
        print("Analysis results:", analysis_results)
        
        # Remake into analysis results object, that contains the analysis issues and drills, and the ids of those issues and drills once they are inserted into the database
        analysis_results_object = AnalysisResponseDTO(
            issues=analysis_results.get("issues", []),
            club_type=analysis_results.get("club_type"),
            camera_view=analysis_results.get("camera_view"),
        )
        
        # Insert analysis_issues that are found in the analysis_results_object
        for issue in analysis_results_object.issues:
            analysis_issue_object = AnalysisIssue(
                analysis_id=analysis_object.id,
                issue_id=issue["issue_id"],
                confidence=issue["confidence"]
            )
            create_analysis_issue(analysis_issue=analysis_issue_object, session=db_session)
        
        # Set completed state on analysis object
        analysis_object.status = 'completed'
        analysis_object.success = True
        update_analysis(analysis=analysis_object, session=db_session)
        
        # Commit to db
        db_session.commit()
    except Exception as e:
        analysis_object.error_message = str(e)
        analysis_object.success = False
        update_analysis(analysis=analysis_object, session=db_session)
        db_session.commit()
        raise
    
    
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

