from core.infrastructure.db import models
from core.infrastructure.db.repositories import practice_sessions as repo
from core.infrastructure.db.repositories import drills as drill_repo
from core.infrastructure.db.repositories import analysis_issues as analysis_issue_repo
from core.infrastructure.db.repositories import issues as issue_repo
from core.services import exceptions
from core.services import drill_metrics
from core.services.dtos.practice_session_service_dto import (
    PracticeSessionResponseDTO,
    PracticeDrillRunResponseDTO,
    CompleteDrillRunDTO,
)

from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime, timezone


# =========== PRACTICE SESSIONS ============ 

def record_practice_session_start(
    user_id: UUID,
    analysis_issue_id: UUID | None,
    session: Session,
    session_type: str | None = None,
    notes: str | None = None,
    issue_id: UUID | None = None,
) -> PracticeSessionResponseDTO:
    """Create a new practice session for the user.

    `issue_id` is what the golfer chose to work on. It is optional because free practice
    has no issue behind it, and because builds shipped before this parameter existed do
    not send it -- those sessions land unattributed rather than being refused.
    """
    new_session = models.PracticeSession(
        user_id=user_id,
        analysis_issue_id=analysis_issue_id,
        status="in_progress",
        session_type=session_type,
        notes=notes,
        area=_resolve_session_area(issue_id, analysis_issue_id, session),
    )
    created_session = repo.create_practice_session(new_session, session)
    return _session_to_response_dto(created_session)


def _resolve_session_area(
    issue_id: UUID | None, analysis_issue_id: UUID | None, session: Session
) -> str | None:
    """Which part of the game this session is, read from the issue being practised.

    Whatever `issues.area` says right now is what gets stamped -- nothing here knows the
    names of any areas, so adding a sixth one needs no change to this function.

    Two sources, in order of how directly they name the issue:

      1. `issue_id`, sent by the client. Covers every path, including the library ones
         that have no AnalysisIssue at all.
      2. `analysis_issue_id`, for older builds that only send that. Resolves through to
         the same issue.

    Returns None when neither is available or the row has gone. That is unattributed, not
    an error: the session is real work the golfer did and must still earn its square.
    """
    if issue_id is not None:
        issue = issue_repo.get_issue_by_id(issue_id, session)
        if issue is not None:
            return issue.area

    if analysis_issue_id is not None:
        analysis_issue = analysis_issue_repo.get_analysis_issue_by_id(analysis_issue_id, session)
        if analysis_issue is not None and analysis_issue.issue is not None:
            return analysis_issue.issue.area

    return None
    
    
def record_practice_session_completion(session_id: UUID, session: Session) -> PracticeSessionResponseDTO:
    """Mark a practice session as completed."""
    practice_session = repo.get_practice_session_by_id(session_id, session)
    if not practice_session:
        raise exceptions.NotFoundException(f"Practice session with ID {session_id} not found", str(session_id))
    
    practice_session.status = "completed"
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
    drill: models.Drill = get_drill_by_id(drill_id, session)
    return _drill_run_to_response_dto(created_drill_run, drill_title=drill.title, metric=drill.metric)


def record_drill_run_completion(drill_run_dto: CompleteDrillRunDTO, session: Session) -> PracticeDrillRunResponseDTO:
    """Record the completion of a drill run."""
    drill_run = repo.get_practice_drill_run_by_id(drill_run_dto.drill_run_id, session)
    if not drill_run:
        raise exceptions.NotFoundException(f"Drill run with ID {drill_run_dto.drill_run_id} not found", str(drill_run_dto.drill_run_id))

    drill: models.Drill = get_drill_by_id(drill_run.drill_id, session)

    _reject_mismatched_score(drill, drill_run_dto)

    drill_run.completed_at = datetime.now(tz=timezone.utc)
    drill_run.failed_reps = drill_run_dto.failed_reps
    drill_run.skipped = drill_run_dto.skipped
    drill_run.feel = _resolve_feel(drill_run_dto)
    # FROZEN: mirrored from `feel`, never taken from the request. The client no longer
    # owns this column, but builds shipped before `feel` existed still read it back and
    # would render every session as zero if it stopped being written.
    drill_run.successful_reps = drill_run.feel or 0
    drill_run.metric_value = drill_run_dto.metric_value
    # Stamped from the drill as it is *now*, so a later retune cannot reinterpret this
    # number. Without it, changing a drill from make_rate to proximity would turn every
    # historical "8 made" into "8 feet away".
    if drill_run_dto.metric_value is not None and isinstance(drill.metric, dict):
        drill_run.metric_type = drill.metric.get("type")

    updated_drill_run = repo.update_practice_drill_run(drill_run, session)
    return _drill_run_to_response_dto(updated_drill_run, drill_title=drill.title, metric=drill.metric)


def _resolve_feel(dto: CompleteDrillRunDTO) -> int | None:
    """How the block felt, reading a pre-`feel` client if that is all we were sent.

    Older builds have no `feel` field: they packed the rough/ok/dialed ordinal into
    `successful_reps`, which is why that column is frozen rather than trusted. Translate
    it here so those sessions still land somewhere honest, and only when the current
    fields are empty -- a client that sends `feel` is the authority on its own block.
    """
    if dto.feel is not None:
        return dto.feel
    if dto.metric_value is not None:
        return None
    return dto.successful_reps if 1 <= dto.successful_reps <= 3 else None


def _reject_mismatched_score(drill: models.Drill, dto: CompleteDrillRunDTO) -> None:
    """A score has to match the drill that produced it.

    A metric_value on a feel-only drill is a client bug -- there are no thresholds to grade
    it against, so it would be stored as a number nothing can ever interpret. Refuse it
    loudly here rather than let it rot in the column.

    The reverse is allowed: a metric drill may arrive with only a feel, which is what an
    older build without the counting UI sends. That is exactly the fallback B2's default
    branch produces, and it must keep working.
    """
    if dto.metric_value is None:
        return
    if not isinstance(drill.metric, dict) or not drill.metric.get("type"):
        raise exceptions.ValidationException(
            f"Drill '{drill.title}' is scored on feel, so it has no metric to record "
            f"a value against."
        )


def get_practice_session_results(session_id: UUID, session: Session) -> list[PracticeDrillRunResponseDTO]:
    """Retrieve the results of a completed practice session."""
    drill_runs = repo.get_practice_drill_runs_by_session_id(session_id, session)
    drills: list[models.Drill] = drill_repo.get_drills_by_ids(
        [run.drill_id for run in drill_runs if run.drill_id is not None], session
    )
    drill_id_to_title = {drill.id: drill.title for drill in drills}
    drill_id_to_metric = {drill.id: drill.metric for drill in drills}
    return [
        _drill_run_to_response_dto(
            run,
            # "Unknown Drill" covers a run whose drill was deleted. drill_id is nullable
            # now precisely so that run survives instead of blocking the delete.
            drill_title=drill_id_to_title.get(run.drill_id, "Unknown Drill"),
            metric=drill_id_to_metric.get(run.drill_id),
        )
        for run in drill_runs
    ]


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
        area=session.area,
    )


def _drill_run_to_response_dto(
    drill_run: models.PracticeDrillRun,
    drill_title: str,
    metric: dict | None = None,
) -> PracticeDrillRunResponseDTO:
    """Convert PracticeDrillRun model to response DTO.

    `grade` is re-derived on every read rather than stored. Retuning a drill's thresholds
    in the admin therefore changes how past runs *read* on the results screen, which is the
    behaviour you want from a judgement; it does not rewind strength, which was banked at
    the time and is a running total.
    """
    return PracticeDrillRunResponseDTO(
        id=drill_run.id,
        session_id=drill_run.session_id,
        drill_id=drill_run.drill_id,
        drill_title=drill_title,
        status="completed" if drill_run.completed_at else "in_progress",
        successful_reps=drill_run.successful_reps,
        failed_reps=drill_run.failed_reps,
        skipped=drill_run.skipped,
        started_at=drill_run.started_at,
        completed_at=drill_run.completed_at,
        feel=drill_run.feel,
        metric_value=float(drill_run.metric_value) if drill_run.metric_value is not None else None,
        metric_type=drill_run.metric_type,
        grade=drill_metrics.grade_for(metric, drill_run.metric_value),
    )
    
    
def get_drill_by_id(drill_id: UUID, session: Session) -> models.Drill:
    """Helper function to retrieve a drill by ID."""
    drill = drill_repo.get_drill_by_id(drill_id, session)
    if not drill:
        raise exceptions.NotFoundException(f"Drill with ID {drill_id} not found", str(drill_id))
    return drill