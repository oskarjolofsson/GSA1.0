

from sqlalchemy.orm import Session
from uuid import UUID
from collections import defaultdict
from datetime import datetime

from core.infrastructure.db.repositories.issues import (
    get_issue_by_id as repo_get_issue_by_id,
    create_issue as repo_create_issue,
    update_issue as repo_update_issue,
    delete_issue as repo_delete_issue,
    get_issues_by_analysis_id as repo_get_issues_by_analysis_id,
    get_issues_by_drill_id as repo_get_issues_by_drill_id,
    get_all_issues as repo_get_all_issues,
    get_issues_by_user_id as repo_get_issues_by_user_id,
    get_issues_by_ids as repo_get_issues_by_ids,
    delete_issues as repo_delete_issues,
)
from core.infrastructure.db.repositories.analysis_issues import (
    get_analysis_issue_by_user_id_and_issue_id as repo_get_analysis_issue_by_user_id_and_issue_id
)
from core.infrastructure.db.repositories import practice_sessions as ps_repo
from core.infrastructure.db.models.Issue import Issue
from core.infrastructure.db.models.AnalysisIssue import AnalysisIssue
from core.infrastructure.db import models
from .dtos.issues_service_dto import CreateIssueDTO, UpdateIssueDTO, IssueResponseDTO, IssueProgressDTO
from core.services.exceptions import NotFoundException


def create_issue(dto: CreateIssueDTO, db_session: Session) -> IssueResponseDTO:
    """Create a new issue."""
    new_issue = Issue(
        title=dto.title,
        phase=dto.phase,
        current_motion=dto.current_motion,
        expected_motion=dto.expected_motion,
        swing_effect=dto.swing_effect,
        shot_outcome=dto.shot_outcome,
    )

    created_issue = repo_create_issue(new_issue, db_session)

    return from_issue_to_response_dto(created_issue)


def get_issue_by_id(issue_id: UUID, user_id: UUID, db_session: Session) -> IssueResponseDTO | None:
    """Get an issue by its ID with optional analysis_issue and progress data for the user."""
    issue = repo_get_issue_by_id(issue_id, db_session)

    if not issue:
        raise NotFoundException(f"Issue with ID {issue_id} not found", str(issue_id))

    analysis_issue = _get_analysis_issue_for_user_and_issue(user_id, issue_id, db_session)
    progress = _get_analysis_issue_progress(analysis_issue.id, db_session) if analysis_issue else None
    return from_issue_to_response_dto(issue, analysis_issue, progress)


def _get_issue_response_with_progress(issue: Issue, analysis_issue: AnalysisIssue | None, db_session: Session) -> IssueResponseDTO:
    """Helper to create IssueResponseDTO with progress data."""
    progress = _get_analysis_issue_progress(analysis_issue.id, db_session) if analysis_issue else None
    return from_issue_to_response_dto(issue, analysis_issue, progress)


def get_all_issues(user_id: UUID, db_session: Session) -> list[IssueResponseDTO]:
    """Get all issues with optional analysis_issue and progress data for the user."""
    issues = repo_get_all_issues(db_session)
    return [
        _get_issue_response_with_progress(
            issue,
            _get_analysis_issue_for_user_and_issue(user_id, issue.id, db_session),
            db_session
        )
        for issue in issues
    ]


def get_issues_by_analysis_id(analysis_id: UUID, user_id: UUID, db_session: Session) -> list[IssueResponseDTO]:
    """Get all issues associated with a specific analysis with optional analysis_issue and progress data."""
    issues = repo_get_issues_by_analysis_id(analysis_id, db_session)

    return [
        _get_issue_response_with_progress(
            issue,
            _get_analysis_issue_for_user_and_issue(user_id, issue.id, db_session),
            db_session
        )
        for issue in issues
    ]


def get_issues_by_drill_id(drill_id: UUID, user_id: UUID, db_session: Session) -> list[IssueResponseDTO]:
    """Get all issues associated with a specific drill with optional analysis_issue and progress data."""
    issues = repo_get_issues_by_drill_id(drill_id, db_session)

    return [
        _get_issue_response_with_progress(
            issue,
            _get_analysis_issue_for_user_and_issue(user_id, issue.id, db_session),
            db_session
        )
        for issue in issues
    ]


def get_issues_by_user_id(user_id: UUID, db_session: Session) -> list[IssueResponseDTO]:
    """Get all issues created by a specific user with analysis_issue and progress data."""
    issues: list[Issue] = repo_get_issues_by_user_id(user_id, db_session)
    return [
        _get_issue_response_with_progress(
            issue,
            _get_analysis_issue_for_user_and_issue(user_id, issue.id, db_session),
            db_session
        )
        for issue in issues
    ]


def update_issue(issue_id: UUID, dto: UpdateIssueDTO, db_session: Session) -> IssueResponseDTO | None:
    """Update an existing issue.

    Args:
        issue_id (UUID): The ID of the issue to update.
        dto (UpdateIssueDTO): The data to update the issue with.

    Returns:
        IssueResponseDTO: The updated issue data with progress.
    """
    issue = repo_get_issue_by_id(issue_id, db_session)

    if not issue:
        raise NotFoundException(f"Issue with ID {issue_id} not found", str(issue_id))
    
    # Only update fields that are provided
    if dto.title is not None:
        issue.title = dto.title
    if dto.phase is not None:
        issue.phase = dto.phase
    if dto.current_motion is not None:
        issue.current_motion = dto.current_motion
    if dto.expected_motion is not None:
        issue.expected_motion = dto.expected_motion
    if dto.swing_effect is not None:
        issue.swing_effect = dto.swing_effect
    if dto.shot_outcome is not None:
        issue.shot_outcome = dto.shot_outcome
    updated_issue = repo_update_issue(issue, db_session)
    
    # Note: update_issue doesn't have user_id context, so progress won't be included
    return from_issue_to_response_dto(updated_issue)


def delete_issue(issue_id: UUID, db_session: Session) -> None:
    """Delete an issue by its ID."""
    issue = repo_get_issue_by_id(issue_id, db_session)
    if not issue:
        raise NotFoundException(f"Issue ID not found", str(issue_id))
    repo_delete_issue(issue, db_session)


def delete_issues_bulk(issue_ids: list[UUID], db_session: Session) -> None:
    """Delete multiple issues by their IDs."""
    issues = repo_get_issues_by_ids(issue_ids, db_session)
    if len(issues) != len(issue_ids):
        raise NotFoundException(f"One or more issues not found", str(issue_ids))
    repo_delete_issues(issues, db_session)

# ------------ Helper Methods ------------


def _get_analysis_issue_for_user_and_issue(user_id: UUID, issue_id: UUID, db_session: Session) -> AnalysisIssue | None:
    """Get the analysis_issue for a specific user and issue combination."""
    return repo_get_analysis_issue_by_user_id_and_issue_id(user_id, issue_id, db_session)


def from_issue_to_response_dto(issue: Issue, analysis_issue: AnalysisIssue | None = None, progress: IssueProgressDTO | None = None) -> IssueResponseDTO:
    """Transform an Issue object to IssueResponseDTO with optional analysis_issue and progress data."""
    return IssueResponseDTO(
        id=issue.id,
        title=issue.title,
        phase=issue.phase,
        current_motion=issue.current_motion,
        expected_motion=issue.expected_motion,
        swing_effect=issue.swing_effect,
        shot_outcome=issue.shot_outcome,
        created_at=issue.created_at.isoformat() if issue.created_at else None,
        analysis_issue_id=str(analysis_issue.id) if analysis_issue else None,
        analysis_id=str(analysis_issue.analysis_id) if analysis_issue else None,
        confidence=analysis_issue.confidence if analysis_issue else None,
        progress=progress,
    )


# ------------ Progress Tracking Helpers (moved from progress_service) ------------


def _get_analysis_issue_progress(analysis_issue_id: str, db_session: Session) -> IssueProgressDTO | None:
    """Fetch progress data for an analysis issue."""
    analysis_issue = db_session.get(models.AnalysisIssue, analysis_issue_id)
    if not analysis_issue: raise NotFoundException(f"AnalysisIssue with ID {analysis_issue_id} not found", analysis_issue_id)

    sessions: list[models.PracticeSession] = ps_repo.get_practice_sessions_by_analysis_issue_id(
        analysis_issue_id=analysis_issue_id,
        session=db_session,
    )

    drill_runs: list[models.PracticeDrillRun] = ps_repo.get_practice_drill_runs_by_session_ids(
        [session.id for session in sessions],
        session=db_session,
    )

    completed_sessions = sum(1 for session in sessions if session.status == "completed")
    in_progress_sessions = sum(1 for session in sessions if session.status == "in_progress")
    abandoned_sessions = sum(1 for session in sessions if session.status == "abandoned")

    total_successful_reps = sum(drill_run.successful_reps for drill_run in drill_runs)
    total_failed_reps = sum(drill_run.failed_reps for drill_run in drill_runs)
    total_reps = total_successful_reps + total_failed_reps

    overall_success_rate = _compute_success_rate(total_successful_reps, total_failed_reps)

    last_completed_at = max(
        (
            session.completed_at
            for session in sessions
            if session.status == "completed" and session.completed_at is not None
        ),
        default=None,
    )

    runs_by_session_id: dict[str, list[models.PracticeDrillRun]] = defaultdict(list)
    for drill_run in drill_runs:
        runs_by_session_id[str(drill_run.session_id)].append(drill_run)

    completed_session_rates: list[tuple[datetime, float]] = []

    for session in sessions:
        if session.status != "completed":
            continue

        session_runs = runs_by_session_id.get(str(session.id), [])

        session_successful_reps = sum(run.successful_reps for run in session_runs)
        session_failed_reps = sum(run.failed_reps for run in session_runs)

        session_success_rate = _compute_success_rate(
            session_successful_reps,
            session_failed_reps,
        )

        if session_success_rate is None:
            continue

        session_time = session.completed_at or session.started_at
        completed_session_rates.append((session_time, session_success_rate))

    completed_session_rates.sort(key=lambda item: item[0])

    recent_session_success_rates = [
        rate for _, rate in completed_session_rates[-5:]
    ]

    trend = _compute_trend(recent_session_success_rates)

    return IssueProgressDTO(
        completed_sessions=completed_sessions,
        in_progress_sessions=in_progress_sessions,
        abandoned_sessions=abandoned_sessions,
        total_successful_reps=total_successful_reps,
        total_failed_reps=total_failed_reps,
        total_reps=total_reps,
        overall_success_rate=overall_success_rate,
        recent_session_success_rates=recent_session_success_rates,
        trend=trend,
        last_completed_at=last_completed_at,
    )


def _compute_success_rate(successful_reps: int, failed_reps: int) -> float | None:
    """Compute success rate from reps."""
    total = successful_reps + failed_reps
    if total == 0:
        return None
    return successful_reps / total


def _compute_trend(recent_rates: list[float]) -> str:
    """Compute trend from recent success rates."""
    if len(recent_rates) < 2:
        return "insufficient_data"

    first = recent_rates[0]
    last = recent_rates[-1]
    delta = last - first

    if delta >= 0.10:
        return "improving"
    if delta <= -0.10:
        return "declining"
    return "stable"