from .dtos.analysis_service_dto import (
    CreateAnalysisDTO,
    GetAnalaysisIssueDTO,
    RunAnalysisDTO,
    AnalysisResponseDTO,
    GetAnalaysisDTO,
)
from .exceptions import NotFoundException, InvalidStateException, InvalidVideoException

# Infrastructure imports
from ..infrastructure.storage.r2Adaptor import generate_upload_url, put_object
from ..infrastructure.db.repositories.analysis import (
    create_analysis as create_analysis_in_db,
    get_analysis_by_id as get_analysis_by_id_in_db,
    update_analysis,
    get_analyses_by_user_id as get_analyses_by_user_id_in_db,
    delete_analysis as delete_analysis_in_db,
)
from ..infrastructure.db.repositories.videos import (
    create_video,
    update_video,
    get_video_by_id,
)
from ..infrastructure.db.models.Analysis import Analysis
from ..infrastructure.db.models.Video import Video
from ..infrastructure.db.repositories.analysis_issues import (
    create_analysis_issue,
    get_analysis_issue_by_id,
    get_analysis_issues_by_analysis_id,
    delete_analysis_issue as delete_analysis_issue_in_db,
    modify_analysis_issue as modify_analysis_issue_in_db
)
from ..infrastructure.db.models.AnalysisIssue import AnalysisIssue
from ..infrastructure.storage.r2Adaptor import get_object
from ..infrastructure.storage.r2Client import r2_client
from ..infrastructure.local_files.file_types.Video_file import Video_file

from ..infrastructure.AI.google.client import GoogleAnalysisClient
from ..infrastructure.AI.google.videoAnalyzer import analyze_video
from uuid import UUID
import os
import tempfile
from ..infrastructure.db.repositories.prompts import (
    create_prompt,
    get_prompt_by_analysis_id,
)
from ..infrastructure.db.models.Prompt import Prompt
from datetime import datetime, timezone


def create_analysis(dto: CreateAnalysisDTO, db_session) -> dict:
    analysis = None
    try:
        video: Video = Video(
            user_id=dto.user_id, start_time=dto.start_time, end_time=dto.end_time
        )
        video = create_video(video=video, session=db_session)

        analysis = Analysis(
            user_id=dto.user_id,
            model_version=dto.model,
            video_id=video.id,
            status="awaiting_upload",
        )
        analysis: Analysis = create_analysis_in_db(
            analysis=analysis, session=db_session
        )

        # Create prompt entry
        prompt = Prompt(
            analysis_id=analysis.id,
            prompt_shape=dto.prompt_shape,
            prompt_height=dto.prompt_height,
            prompt_misses=dto.prompt_misses,
            prompt_extra=dto.prompt_extra,
        )
        create_prompt(prompt=prompt, session=db_session)

        video_key = f"videos/{video.id}"
        thumbnail_key = f"thumbnails/{video.id}.webp"
        video.video_key = video_key
        video.thumbnail_key = thumbnail_key
        update_video(video=video, session=db_session)

        upload_url = generate_upload_url(key=video_key)

        return {"analysis_id": analysis.id, "upload_url": upload_url}
    except Exception as e:
        if analysis:
            try:
                analysis.error_message = str(e)
                analysis.success = False
                analysis.status = "failed"
                update_analysis(analysis=analysis, session=db_session)
                db_session.commit()  # Commit error state before re-raising
            except Exception:
                pass  # If we can't save error state, continue with original exception
        raise


def run_analysis(dto: RunAnalysisDTO, db_session) -> GetAnalaysisDTO:
    # Check that analysis exists and is in correct state by getting that analysis object from the database with the analysis_id
    analysis_object: Analysis = get_analysis_by_id_in_db(
        analysis_id=dto.analysis_id, session=db_session
    )
    if analysis_object is None:
        raise NotFoundException("Analysis", str(dto.analysis_id))
    
    if analysis_object.status != "awaiting_upload":
        raise InvalidStateException(f"Analysis is in '{analysis_object.status}' state, expected 'awaiting_upload'")

    try:
        # Set processing state on analysis object
        analysis_object.status = "processing"
        analysis_object.started_at = datetime.now(timezone.utc)
        analysis_object = update_analysis(analysis=analysis_object, session=db_session)

        # Fetch prompts for this analysis
        prompt_object = get_prompt_by_analysis_id(analysis_id=analysis_object.id, session=db_session)

        # Download the video from R2 using the video_key in analysis, and save it to a temporary location
        video_object: Video = get_video_by_id(
            analysis_object.video_id, session=db_session
        )
        try:
            video_data: bytes = get_object(video_object.video_key)
        except Exception as e:
            raise InvalidVideoException(f"Failed to download video from storage: {str(e)}")
        video_file = Video_file(f=video_data)
        if (video_object.end_time and video_object.start_time) and (video_object.end_time > video_object.start_time):
            video_file = video_file.trim(start_seconds=video_object.start_time.total_seconds(), end_seconds=video_object.end_time.total_seconds())
        put_object(key=video_object.video_key, data=video_file.read(), content_type="video/mp4")    # Update the video in R2 to be trimmed

        # Start analysis process with prompts from database
        analysis_results: dict = (
            analyze_video(
                client=GoogleAnalysisClient().client,
                video_path=video_file.path(),
                shape=prompt_object.prompt_shape if prompt_object else None,
                height=prompt_object.prompt_height if prompt_object else None,
                misses=prompt_object.prompt_misses if prompt_object else None,
                extra=prompt_object.prompt_extra if prompt_object else None,
                model=analysis_object.model_version,
                db_session=db_session,
            )
        )
        
        # Extract thumbnail from video and upload to R2
        try:
            # Create temporary file for thumbnail
            tmp_dir = tempfile.mkdtemp()
            local_thumb = os.path.join(tmp_dir, "thumbnail.webp")
            
            try:
                # Extract thumbnail from video file
                _extract_thumbnail_webp(
                    video_file.path(),
                    local_thumb,
                    timestamp=1.5,
                )
                
                # Upload thumbnail to R2
                with open(local_thumb, "rb") as f:
                    put_object(
                        key=video_object.thumbnail_key,
                        data=f.read(),
                        content_type="image/webp"
                    )  
            finally:
                # Cleanup thumbnail temp files
                if os.path.exists(local_thumb):
                    os.remove(local_thumb)
                if os.path.exists(tmp_dir):
                    os.rmdir(tmp_dir)
        except Exception as e:
            # Log thumbnail generation failure but don't fail the analysis
            print(f"Warning: Failed to generate thumbnail: {str(e)}")
            raise InvalidVideoException(f"Failed to generate thumbnail: {str(e)}")
        finally:
            analysis_object.completed_at = datetime.now(timezone.utc)
            update_analysis(analysis=analysis_object, session=db_session)
        
        # Delete the video file from the temporary location
        video_file.remove()
        
        if not analysis_results.get("success", False):
            raise InvalidVideoException(analysis_results.get("error_message", "Video analysis failed"))

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
                confidence=issue["confidence"],
            )
            create_analysis_issue(
                analysis_issue=analysis_issue_object, session=db_session
            )

        # Set completed state on analysis object
        analysis_object.status = "completed"
        analysis_object.success = True
        analysis_object = update_analysis(analysis=analysis_object, session=db_session)
        
        return from_analysis_object_to_dto(analysis_object)
    except Exception as e:
        try:
            analysis_object.error_message = str(e)
            analysis_object.success = False
            analysis_object.status = "failed"
            update_analysis(analysis=analysis_object, session=db_session)
            db_session.commit()  # Commit error state before re-raising
        except Exception:
            pass  # If we can't save error state, continue with original exception
        raise


def get_analysis_by_id(analysis_id: UUID, db_session) -> GetAnalaysisDTO:
    analysis_object: Analysis = get_analysis_by_id_in_db(
        analysis_id=analysis_id, session=db_session
    )
    if analysis_object is None:
        raise NotFoundException("Analysis", str(analysis_id))

    return_analysis_object = from_analysis_object_to_dto(analysis_object)
    return return_analysis_object


def get_analyses_by_user_id(user_id: UUID, db_session) -> list[GetAnalaysisDTO]:
    analysis_objects: list[Analysis] = get_analyses_by_user_id_in_db(
        user_id=user_id, session=db_session
    )

    return_analysis_objects = []
    for analysis_object in analysis_objects:
        return_analysis_objects.append(from_analysis_object_to_dto(analysis_object))

    return return_analysis_objects


def delete_analysis(analysis_id: UUID, db_session) -> None:
    analysis_object: Analysis = get_analysis_by_id_in_db(
        analysis_id=analysis_id, session=db_session
    )
    if analysis_object is None:
        raise NotFoundException("Analysis", str(analysis_id))

    # Deleting the analysis will also delete the analysis issues that belong to that analysis, because of the cascade delete relationship defined in the Analysis model
    delete_analysis_in_db(analysis=analysis_object, session=db_session)


def get_analysis_issues(analysis_id: UUID, db_session) -> list[GetAnalaysisIssueDTO]:
    analysis_issues: list[AnalysisIssue] = get_analysis_issues_by_analysis_id(
        analysis_id=analysis_id, session=db_session
    )
    
    if not analysis_issues:
        raise NotFoundException("No Analysis issues found with analysis ID", str(analysis_id))
    
    analysis_issue_dtos = [
        from_analysis_issue_object_to_dto(issue) for issue in analysis_issues
    ]
    return analysis_issue_dtos


def delete_analysis_issue(analysis_issue_id: UUID, db_session) -> None:
    analysis_issue_object: AnalysisIssue = get_analysis_issue_by_id(
        analysis_issue_id=analysis_issue_id, session=db_session
    )
    if analysis_issue_object is None:
        raise NotFoundException("AnalysisIssue", str(analysis_issue_id))
    
    analysis_issue_object.active = False
    modify_analysis_issue_in_db(
        analysis_issue=analysis_issue_object, session=db_session
    )


# ------------------------------ Helper functions ------------------------------


def from_analysis_object_to_dto(analysis_object: Analysis) -> GetAnalaysisDTO:
    return GetAnalaysisDTO(
        analysis_id=analysis_object.id,
        user_id=analysis_object.user_id,
        video_id=analysis_object.video_id,
        model_version=analysis_object.model_version,
        status=analysis_object.status,
        success=analysis_object.success,
        error_message=analysis_object.error_message,
        created_at=analysis_object.created_at,
        started_at=analysis_object.started_at,
        completed_at=analysis_object.completed_at,
    )


def from_analysis_issue_object_to_dto(
    analysis_issue_object: AnalysisIssue,
) -> GetAnalaysisIssueDTO:
    return GetAnalaysisIssueDTO(
        analysis_issue_id=analysis_issue_object.id,
        analysis_id=analysis_issue_object.analysis_id,
        issue_id=analysis_issue_object.issue_id,
        confidence=analysis_issue_object.confidence,
        created_at=analysis_issue_object.created_at,
    )
    
    
import subprocess


def _extract_thumbnail_webp(
    input_path: str,
    output_path: str,
    timestamp: float,
) -> None:
    cmd = [
        "ffmpeg",
        "-y",
        "-ss", str(timestamp),
        "-i", input_path,
        "-frames:v", "1",
        "-c:v", "libwebp",
        "-quality", "15",
        output_path,
    ]

    subprocess.run(cmd, check=True)