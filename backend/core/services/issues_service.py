from sqlalchemy.orm import Session
from uuid import UUID

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
from core.infrastructure.db.repositories import analysis_issues as repo_analysis_issues

from core.infrastructure.db.repositories import practice_sessions as ps
from core.infrastructure.db.repositories import programs as programs_repo
from core.infrastructure.db.models.Issue import Issue
from core.infrastructure.db import models
from .dtos.issues_service_dto import CreateIssueDTO, UpdateIssueDTO, IssueResponseDTO, SimplifiedIssueProgressDTO
from core.services.exceptions import NotFoundException

from core.services.progress.analysis_issue_progress import Analysis_progress_service


def create_issue(dto: CreateIssueDTO, db_session: Session) -> IssueResponseDTO:
    """Create a new issue."""
    new_issue = Issue(
        title=dto.title,
        description=dto.description,
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

    analysis_issue: models.AnalysisIssue = repo_analysis_issues.get_analysis_issues_by_user_id_and_issue_id(user_id, issue_id, db_session)
    if analysis_issue:
        progress: SimplifiedIssueProgressDTO = _get_progress_for_issues([analysis_issue[0]], db_session)[0]  # Get progress for this specific analysis issue
        return from_issue_to_response_dto(issue, analysis_issue[0], progress)
    return from_issue_to_response_dto(issue)


def get_all_issues(user_id: UUID, db_session: Session) -> list[IssueResponseDTO]:
    issues: list[models.Issue] = repo_get_all_issues(db_session)
    return [from_issue_to_response_dto(issue) for issue in issues]


def get_issues_by_drill_id(drill_id: UUID, user_id: UUID, db_session: Session) -> list[IssueResponseDTO]:
    """Get all issues associated with a specific drill with optional analysis_issue and progress data."""
    issues = repo_get_issues_by_drill_id(drill_id, db_session)
    return [from_issue_to_response_dto(issue) for issue in issues]


def get_issues_by_analysis_id(analysis_id: UUID, user_id: UUID, db_session: Session) -> list[IssueResponseDTO]:
    """Get all issues associated with a specific analysis with optional analysis_issue and progress data."""
    issues = repo_get_issues_by_analysis_id(analysis_id, db_session)
    return _batch_fetch_analysis_issues_and_progress(user_id, issues, db_session)


def get_issues_by_user_id(user_id: UUID, db_session: Session) -> list[IssueResponseDTO]:
    """Get all issues created by a specific user with analysis_issue, progress, and
    program-status data.

    Focus model (one program at a time): each issue is annotated with its program
    status, then ordered active → not-started → completed; within a group by
    confidence then recency. So the home opens on the current focus (the active
    program, or the highest-priority not-started issue), and finished issues sink.
    """
    issues: list[Issue] = repo_get_issues_by_user_id(user_id, db_session)
    dtos = _batch_fetch_analysis_issues_and_progress(user_id, issues, db_session)

    # Annotate each issue with its program status (active wins over completed).
    programs = programs_repo.get_programs_by_user(user_id, db_session)
    status_by_issue: dict[str, str] = {}
    for program in programs:
        key = str(program.analysis_issue_id)
        if key not in status_by_issue or program.status == "active":
            status_by_issue[key] = program.status
    for dto in dtos:
        dto.program_status = status_by_issue.get(dto.analysis_issue_id)

    # Stable multi-key sort: recency first (newest), then group + confidence.
    dtos.sort(key=lambda d: d.created_at or "", reverse=True)
    dtos.sort(key=lambda d: (_program_group(d), -(d.confidence if d.confidence is not None else 0.0)))
    return dtos


def get_todays_issue(user_id: UUID, db_session: Session) -> IssueResponseDTO | None:
    """The user's current focus issue: the active program's issue, else the
    highest-priority not-started issue, else the top completed one. This is just
    the first element of the focus-ordered list. None when the user has no issues.
    """
    issues = get_issues_by_user_id(user_id, db_session)
    return issues[0] if issues else None


def _program_group(issue: IssueResponseDTO) -> int:
    """Focus ordering group: active (0) → not-started (1) → completed (2)."""
    if issue.program_status == "active":
        return 0
    if issue.program_status == "completed":
        return 2
    return 1


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
    if dto.description is not None:
        issue.description = dto.description
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


def from_issue_to_response_dto(issue: Issue, analysis_issue: models.AnalysisIssue | None = None, progress: SimplifiedIssueProgressDTO | None = None) -> IssueResponseDTO:
    """Transform an Issue object to IssueResponseDTO with optional analysis_issue and progress data."""
    return IssueResponseDTO(
        id=issue.id,
        title=issue.title,
        phase=issue.phase,
        description=issue.description,
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


def _get_progress_for_issues(analysis_issues: list[models.AnalysisIssue], db_session: Session) -> list[SimplifiedIssueProgressDTO]:
    """Fetch progress data for a list of analysis issues and return a mapping of issue_id to progress."""
    if not analysis_issues:
        return []
    
    practice_sessions: list[models.PracticeSession] = ps.get_practice_sessions_by_analysis_issue_ids([analysis_issue.id for analysis_issue in analysis_issues], db_session)
    drill_runs: list[models.PracticeDrillRun] = ps.get_practice_drill_runs_by_session_ids([session.id for session in practice_sessions], db_session)
    
    progress_service = Analysis_progress_service(
        analysis_issue=analysis_issues,
        practice_sessions=practice_sessions,
        drill_runs=drill_runs
    )
    
    progress_data: list[SimplifiedIssueProgressDTO] = progress_service.get_total_simple_progress()
    return progress_data


def _batch_fetch_analysis_issues_and_progress(user_id: UUID, issues: list[Issue], db_session: Session) -> list[IssueResponseDTO]:
    """Batch fetch analysis issues and progress data for a list of issues."""
    issue_ids: list[UUID] = [issue.id for issue in issues]
    analysis_issues: list[models.AnalysisIssue] = repo_analysis_issues.get_analysis_issues_by_user_id_and_issue_ids(user_id=user_id, issue_ids=issue_ids, session=db_session)
    progress_data: list[SimplifiedIssueProgressDTO] = _get_progress_for_issues(analysis_issues, db_session)
    
    if not analysis_issues or not progress_data:
        # If there are no analysis issues or progress data, we can return the issues without progress data
        return [from_issue_to_response_dto(issue) for issue in issues]

    analysis_issues_by_issue_id: dict[UUID, models.AnalysisIssue] = {ai.issue_id: ai for ai in analysis_issues}
    progress_by_issue_id: dict[UUID, SimplifiedIssueProgressDTO] = {ai.issue_id: p for ai, p in zip(analysis_issues, progress_data, strict=True)}

    return_li = [
        from_issue_to_response_dto(issue, analysis_issues_by_issue_id.get(issue.id), progress_by_issue_id.get(issue.id))
        for issue in issues
    ]
    
    return_li.sort(
        key=lambda x: (
            x.progress.overall_success_rate
            if x.progress and x.progress.overall_success_rate is not None
            else -1.0
        ),
        reverse=True,
    )
    return return_li