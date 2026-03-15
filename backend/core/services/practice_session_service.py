from core.infrastructure.db import models
from core.infrastructure.db.repositories import practice_sessions as repo
from core.services import exceptions
from core.services.dtos.practice_session_service_dto import (
    StartPracticeSessionDTO,
    PracticeSessionResponseDTO,
    StartDrillRunDTO,
    PracticeDrillRunResponseDTO,
    RecordRepCompletionDTO,
    PracticeRepResponseDTO,
    CompleteDrillRunDTO,
)

from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime, timezone


# =========== PRACTICE SESSIONS ============ 

def record_practice_session_start(user_id: UUID, analysis_issue_id: UUID | None, session: Session) -> PracticeSessionResponseDTO:
    """Create a new practice session for the user."""
    new_session = models.PracticeSession(
        user_id=user_id,
        analysis_issue_id=analysis_issue_id,
        status="in_progress",
    )
    created_session = repo.create_practice_session(new_session, session)
    return _session_to_response_dto(created_session)
    
    
def record_practice_session_completion(session_id: UUID, session: Session) -> PracticeSessionResponseDTO:
    """Mark a practice session as completed."""
    practice_session = repo.get_practice_session_by_id(session_id, session)
    if not practice_session:
        raise exceptions.NotFoundException(f"Practice session with ID {session_id} not found", str(session_id))
    
    practice_session.status = "completed"
    practice_session.completed_at = datetime.now(tz=timezone.utc)
    updated_session = repo.update_practice_session(practice_session, session)
    return _session_to_response_dto(updated_session)
    
    
def record_practice_session_abandonment(session_id: UUID, session: Session) -> PracticeSessionResponseDTO:
    """Mark a practice session as abandoned."""
    practice_session = repo.get_practice_session_by_id(session_id, session)
    if not practice_session:
        raise exceptions.NotFoundException(f"Practice session with ID {session_id} not found", str(session_id))
    
    practice_session.status = "abandoned"
    practice_session.completed_at = datetime.now(tz=timezone.utc)
    updated_session = repo.update_practice_session(practice_session, session)
    return _session_to_response_dto(updated_session)


def get_practice_session_by_id(session_id: UUID, session: Session) -> PracticeSessionResponseDTO:
    """Retrieve a practice session by its ID."""
    practice_session = repo.get_practice_session_by_id(session_id, session)
    if not practice_session:
        raise exceptions.NotFoundException(f"Practice session with ID {session_id} not found", str(session_id))
    return _session_to_response_dto(practice_session)
    
    
# =========== PRACTICE DRILL RUNS ============

    
def record_drill_run_start(session_id: UUID, drill_id: UUID, order_index: int | None, session: Session) -> PracticeDrillRunResponseDTO:
    """Record the start of a drill run within a practice session."""
    new_drill_run = models.PracticeDrillRun(
        session_id=session_id,
        drill_id=drill_id,
        order_index=order_index,
    )
    created_drill_run = repo.create_practice_drill_run(new_drill_run, session)
    return _drill_run_to_response_dto(created_drill_run)
    
    
def record_drill_run_completion(drill_run_dto: CompleteDrillRunDTO, session: Session) -> PracticeDrillRunResponseDTO:
    """Record the completion of a drill run."""
    drill_run = repo.get_practice_drill_run_by_id(drill_run_dto.drill_run_id, session)
    if not drill_run:
        raise exceptions.NotFoundException(f"Drill run with ID {drill_run_dto.drill_run_id} not found", str(drill_run_dto.drill_run_id))

    drill_run.completed_at = datetime.now(tz=timezone.utc)
    drill_run.successful_reps = drill_run_dto.successful_reps
    drill_run.failed_reps = drill_run_dto.failed_reps
    drill_run.skipped = drill_run_dto.skipped
    updated_drill_run = repo.update_practice_drill_run(drill_run, session)
    return _drill_run_to_response_dto(updated_drill_run)
    
    
def record_drill_run_skip(drill_run_id: UUID, session: Session) -> PracticeDrillRunResponseDTO:
    """Record the skipping of a drill run."""
    drill_run = repo.get_practice_drill_run_by_id(drill_run_id, session)
    if not drill_run:
        raise exceptions.NotFoundException(f"Drill run with ID {drill_run_id} not found", str(drill_run_id))
    
    # Total reps
    reps = repo.get_practice_reps_by_drill_run_id(drill_run_id, session)
    total_reps = len(reps)
    failed = sum(1 for rep in reps if not rep.success)
    
    drill_run.skipped = True
    drill_run.successful_reps = total_reps - failed
    drill_run.failed_reps = failed
    drill_run.completed_at = datetime.now(tz=timezone.utc)
    
    updated_drill_run = repo.update_practice_drill_run(drill_run, session)
    return _drill_run_to_response_dto(updated_drill_run) 


def get_practice_session_results(session_id: UUID, session: Session) -> list[PracticeDrillRunResponseDTO]:
    """Retrieve the results of a completed practice session."""
    drill_runs = repo.get_practice_drill_runs_by_session_id(session_id, session)
    return [_drill_run_to_response_dto(run) for run in drill_runs]   
    
# =========== PRACTICE REPS ============

def record_rep_completion(drill_run_id: UUID, rep_number: int, success: bool, session: Session) -> PracticeRepResponseDTO:
    """Record the completion of a practice rep."""
    rep = models.PracticeRep(
        drill_run_id=drill_run_id,
        rep_number=rep_number,
        success=success,
    )
    created_rep = repo.create_practice_rep(rep, session)
    return _rep_to_response_dto(created_rep)


# =========== HELPER FUNCTIONS ============

def _session_to_response_dto(session: models.PracticeSession) -> PracticeSessionResponseDTO:
    """Convert PracticeSession model to response DTO."""
    return PracticeSessionResponseDTO(
        id=session.id,
        user_id=session.user_id,
        analysis_issue_id=session.analysis_issue_id,
        status=session.status,
        started_at=session.started_at,
        completed_at=session.completed_at,
    )


def _drill_run_to_response_dto(drill_run: models.PracticeDrillRun) -> PracticeDrillRunResponseDTO:
    """Convert PracticeDrillRun model to response DTO."""
    return PracticeDrillRunResponseDTO(
        id=drill_run.id,
        session_id=drill_run.session_id,
        drill_id=drill_run.drill_id,
        status="completed" if drill_run.completed_at else "in_progress",
        successful_reps=drill_run.successful_reps,
        failed_reps=drill_run.failed_reps,
        skipped=drill_run.skipped,
        started_at=drill_run.started_at,
        completed_at=drill_run.completed_at,
    )


def _rep_to_response_dto(rep: models.PracticeRep) -> PracticeRepResponseDTO:
    """Convert PracticeRep model to response DTO."""
    return PracticeRepResponseDTO(
        id=rep.id,
        drill_run_id=rep.drill_run_id,
        rep_number=rep.rep_number,
        success=rep.success,
        created_at=rep.created_at,
    )