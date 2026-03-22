from fastapi import APIRouter, Depends
from uuid import UUID
from sqlalchemy.orm import Session

from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user

from app.api.v1.schemas.practice_session import (
    StartPracticeSessionRequest,
    PracticeSessionResponse,
    StartDrillRunRequest,
    PracticeDrillRun,
)

from core.services.dtos.practice_session_service_dto import CompleteDrillRunDTO
from core.services.practice_session_service import (
    record_practice_session_start as service_start_session,
    record_practice_session_completion as service_complete_session,
    record_drill_run_start as service_start_drill_run,
    record_drill_run_completion as service_complete_drill_run,
    get_practice_session_results as service_get_practice_session_results,
    get_practice_session_by_id as service_get_practice_session_by_id,
)

router = APIRouter()


# =========== PRACTICE SESSION ROUTES ===========

@router.post("/sessions/start", response_model=PracticeSessionResponse, status_code=201)
def start_practice_session(
    request: StartPracticeSessionRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Start a new practice session for the current user.

    Arguments (JSON body):
        analysis_issue_id (UUID, optional): Link to a specific analysis issue

    Returns:
        JSON response with practice session details
    """
    result = service_start_session(
        user_id=current_user["user_id"],
        analysis_issue_id=request.analysis_issue_id,
        session=db,
    )
    return PracticeSessionResponse.from_domain(result)


@router.post("/sessions/{session_id}/complete", response_model=PracticeSessionResponse)
def complete_practice_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Mark a practice session as completed.

    Arguments:
        session_id (UUID): Practice session identifier

    Returns:
        JSON response with updated session details
    """
    result = service_complete_session(session_id=session_id, session=db)
    return PracticeSessionResponse.from_domain(result)


@router.get("/sessions/{session_id}", response_model=PracticeSessionResponse)
def get_practice_session_by_id(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Retrieve details of a specific practice session.

    Arguments:
        session_id (UUID): Practice session identifier

    Returns:
        JSON response with practice session details
    """
    result = service_get_practice_session_by_id(session_id=session_id, session=db)
    return PracticeSessionResponse.from_domain(result)


# =========== DRILL RUN ROUTES ===========

@router.post("/sessions/{session_id}/drills/start", response_model=PracticeDrillRun, status_code=201)
def start_drill_run(
    session_id: UUID,
    request: StartDrillRunRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Start a new drill run within a practice session.

    Arguments:
        session_id (UUID): Practice session identifier

    Arguments (JSON body):
        drill_id (UUID): Drill identifier
        order_index (int, optional): Order of the drill in the session

    Returns:
        JSON response with drill run details
    """
    result = service_start_drill_run(
        session_id=session_id,
        drill_id=request.drill_id,
        order_index=request.order_index,
        session=db,
    )
    return PracticeDrillRun.from_domain(result)


@router.post("/drill-runs/complete", response_model=PracticeDrillRun)
def complete_drill_run(
    request: PracticeDrillRun,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Mark a drill run as completed.

    Arguments:
        drill_run_id (UUID): Drill run identifier
        successful_reps (int): Number of successful repetitions
        failed_reps (int): Number of failed repetitions
        skipped (bool): Whether the drill was skipped

    Returns:
        JSON response with updated drill run details
    """
    dto: CompleteDrillRunDTO = CompleteDrillRunDTO(
        drill_run_id=request.id,
        successful_reps=request.successful_reps,
        failed_reps=request.failed_reps,
        skipped=request.skipped,
    )
    
    result = service_complete_drill_run(drill_run_dto=dto, session=db)
    return PracticeDrillRun.from_domain(result)


@router.get("/sessions/{session_id}/results", response_model=list[PracticeDrillRun])
def get_practice_session_results(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Retrieve the results of a completed practice session.

    Arguments:
        session_id (UUID): Practice session identifier

    Returns:
        JSON response with session results, including drill runs and reps
    """
    drill_runs = service_get_practice_session_results(session_id=session_id, session=db)
    return [PracticeDrillRun.from_domain(run) for run in drill_runs]

