from fastapi import APIRouter, Depends
from uuid import UUID
from datetime import timedelta
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from sqlalchemy.orm import Session


from app.api.v1.schemas.analysis import (
    CreateAnalysisRequest,
    CreateAnalysisResponse,
    GetAnalysis,
    GetAnalysisIssue,
)
from core.services.analysis_service import (
    create_analysis as service_create_analysis,
    run_analysis as service_run_analysis,
    get_analysis_by_id as service_get_analysis_by_id,
    get_analyses_by_user_id as service_get_analyses_by_user_id,
    delete_analysis as service_delete_analysis,
    get_analysis_issues as service_get_analysis_issues,
    delete_analysis_issue as service_delete_analysis_issue,
)
from core.services.dtos.analysis_service_dto import (
    CreateAnalysisDTO,
    RunAnalysisDTO,
)
from core.services.video import (
    get_video_read_url_by_analysis,
    get_video_thumbnail_urls_from_analyses,
)

router = APIRouter()


@router.get("/{analysis_id}/", response_model=GetAnalysis)
def get_analysis(
    analysis_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get details of a specific analysis.
    """
    analysis = service_get_analysis_by_id(analysis_id, db_session=db)

    return GetAnalysis.from_domain(analysis)


@router.post("/", response_model=CreateAnalysisResponse, status_code=201)
def create_analysis(
    request: CreateAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
    ):
    """
    Create an analysis and return a signed upload URL.
    """
    user_id = UUID(current_user["user_id"])
    
    dto = CreateAnalysisDTO(
        user_id=user_id,
        model=request.model,
        start_time=timedelta(seconds=request.start_time),
        end_time=timedelta(seconds=request.end_time),
        prompt_shape=request.prompt_shape,
        prompt_height=request.prompt_height,
        prompt_misses=request.prompt_misses,
        prompt_extra=request.prompt_extra,
    )

    result = service_create_analysis(dto=dto, db_session=db)

    return CreateAnalysisResponse(
        success=True,
        analysis_id=result["analysis_id"],
        upload_url=result["upload_url"],
    )


@router.patch("/{analysis_id}/", response_model=GetAnalysis, status_code=200)
def run_analysis(
    analysis_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Confirm that the video upload has completed.
    Now the analysis processing can be triggered.
    """
    # Note: user_id would typically come from authentication
    # For now, we get it from the analysis
    analysis = service_get_analysis_by_id(analysis_id, db_session=db)

    dto = RunAnalysisDTO(
        user_id=analysis.user_id,
        analysis_id=analysis_id,
    )

    result = service_run_analysis(dto, db_session=db)

    return GetAnalysis.from_domain(result)


@router.get("/", response_model=list[GetAnalysis])
def list_analyses(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    List all analyses for the current authenticated user.
    """
    user_id = UUID(current_user["user_id"])
    analyses = service_get_analyses_by_user_id(user_id, db_session=db)
    
    # Get thumbnail URLs for all analyses
    analysis_ids = [analysis.analysis_id for analysis in analyses]
    thumbnail_result = get_video_thumbnail_urls_from_analyses(analysis_ids, db_session=db)
    
    # Map thumbnail URLs by video_id for easy lookup
    thumbnail_map = thumbnail_result.thumbnail_urls

    return [
        GetAnalysis.from_domain(
            analysis,
            thumbnail_url=thumbnail_map.get(analysis.video_id)
        )
        for analysis in analyses
    ]


@router.get("/{analysis_id}/video-url/")
def get_analysis_video_url(
    analysis_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get a signed URL for downloading the original video associated with an analysis.

    Arguments:
        analysis_id (UUID): Analysis identifier

    Returns:
        JSON response with:
        - success
        - video_url
    """
    result = get_video_read_url_by_analysis(analysis_id, db_session=db)

    return {
        "success": True,
        "video_url": result.video_url,
    }


@router.delete("/{analysis_id}/", status_code=204)
def delete_analysis(
    analysis_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a specific analysis and all associated data.
    """
    service_delete_analysis(analysis_id, db_session=db)


@router.get("/{analysis_id}/issues/", response_model=list[GetAnalysisIssue])
def get_analysis_issues(
    analysis_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get all issues associated with a specific analysis.
    """
    issues = service_get_analysis_issues(analysis_id, db_session=db)

    return [GetAnalysisIssue.from_domain(issue) for issue in issues]


@router.delete("/issues/{analysis_issue_id}/", status_code=204)
def delete_analysis_issue(
    analysis_issue_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a specific analysis issue.
    """
    service_delete_analysis_issue(analysis_issue_id, db_session=db, user_id=current_user["user_id"])
