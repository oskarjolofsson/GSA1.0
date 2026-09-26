from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.orm import Session

from app.api.v2.schemas.analysis import (
    AnalysisDetailsResponse,
    AnalysisStatusResponse,
    CreateAnalysisRequest,
    CreateAnalysisResponse,
)
from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.dependencies.entitlement import require_ai_access
from core.services.analysis_v2_service import (
    create_analysis_v2,
    execute_analysis,
    get_analysis_details,
    get_analysis_status,
    start_analysis,
)
from core.services.dtos.analysis_v2_dto import CreateAnalysisV2DTO
from core.services.video import get_video_thumbnail_urls_from_analyses

router = APIRouter()


@router.post("/", response_model=CreateAnalysisResponse, status_code=201)
def create_analysis(
    request: CreateAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_ai_access),
):
    """
    Create an analysis from the golfer's area, miss and notes, and return a signed URL
    to upload the (already trimmed) video to.

    422 on an unknown area or camera view, or a miss that does not belong to the area.
    """
    created = create_analysis_v2(
        CreateAnalysisV2DTO(
            user_id=UUID(current_user["user_id"]),
            area=request.area,
            miss=request.miss,
            notes=request.notes,
            club_type=request.club_type,
            camera_view=request.camera_view,
        ),
        db_session=db,
    )
    return CreateAnalysisResponse(analysis_id=created.analysis_id, upload_url=created.upload_url)


@router.post("/{analysis_id}/start/", response_model=AnalysisStatusResponse, status_code=202)
def start(
    analysis_id: UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_ai_access),
):
    """
    Start the analysis once the video is uploaded, and return straight away.

    The analysis runs in the background; poll GET /analyses/{id}/ for its status.
    409 when the video is not uploaded yet or the analysis was already started.
    """
    start_analysis(analysis_id, UUID(current_user["user_id"]), db_session=db)
    background_tasks.add_task(execute_analysis, analysis_id)
    return AnalysisStatusResponse(analysis_id=analysis_id, status="processing")


@router.get("/{analysis_id}/", response_model=AnalysisStatusResponse)
def get_status(
    analysis_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    The analysis status: awaiting_upload, processing, completed or failed.

    Cheap enough to poll. When failed, error_message says why.
    """
    status = get_analysis_status(analysis_id, UUID(current_user["user_id"]), db_session=db)
    return AnalysisStatusResponse.from_dto(status)


@router.get("/{analysis_id}/details/", response_model=AnalysisDetailsResponse)
def get_details(
    analysis_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    The result of a completed analysis: the law, the issues breaking it and their drills.

    409 until the analysis has completed.
    """
    details = get_analysis_details(analysis_id, UUID(current_user["user_id"]), db_session=db)
    thumbnails = get_video_thumbnail_urls_from_analyses([analysis_id], db_session=db).thumbnail_urls
    return AnalysisDetailsResponse.from_dto(details, thumbnail_url=thumbnails.get(details.video_id))
