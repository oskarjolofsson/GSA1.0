from fastapi import APIRouter, Depends
from uuid import UUID
from datetime import timedelta
from ....dependencies.db import get_db
from sqlalchemy.orm import Session


from ..schemas.analysis import (
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
from core.services.video import get_video_read_url_by_analysis

router = APIRouter()


@router.post("/", response_model=CreateAnalysisResponse)
def create_analysis(
    request: CreateAnalysisRequest,
    db: Session = Depends(get_db)
    ):
    """
    Create an analysis and return a signed upload URL.
    """
    dto = CreateAnalysisDTO(
        user_id=request.user_id,
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


@router.patch("/{analysis_id}/", response_model=GetAnalysis)
def run_analysis(analysis_id: UUID, db: Session = Depends(get_db)):
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
def list_analyses(user_id: UUID, db: Session = Depends(get_db)):
    """
    List all analyses for a specific user.
    """
    analyses = service_get_analyses_by_user_id(user_id, db_session=db)

    return [GetAnalysis.from_domain(analysis) for analysis in analyses]


@router.get("/{analysis_id}", response_model=GetAnalysis)
def get_analysis(analysis_id: UUID, db: Session = Depends(get_db)):
    """
    Get details of a specific analysis.
    """
    analysis = service_get_analysis_by_id(analysis_id, db_session=db)

    return GetAnalysis.from_domain(analysis)


@router.get("/{analysis_id}/video-url")
def get_analysis_video_url(analysis_id: UUID, db: Session = Depends(get_db)):
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


@router.delete("/{analysis_id}")
def delete_analysis(analysis_id: UUID, db: Session = Depends(get_db)):
    """
    Delete a specific analysis and all associated data.
    """
    service_delete_analysis(analysis_id, db_session=db)


@router.get("/{analysis_id}/issues", response_model=list[GetAnalysisIssue])
def get_analysis_issues(analysis_id: UUID, db: Session = Depends(get_db)):
    """
    Get all issues associated with a specific analysis.
    """
    issues = service_get_analysis_issues(analysis_id, db_session=db)

    return [GetAnalysisIssue.from_domain(issue) for issue in issues]


@router.delete("/{analysis_id}/issues/{analysis_issue_id}")
def delete_analysis_issue(analysis_id: UUID, analysis_issue_id: UUID, db: Session = Depends(get_db)):
    """
    Delete a specific analysis issue.
    """
    service_delete_analysis_issue(analysis_issue_id, db_session=db)
