

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
from core.infrastructure.db.repositories.analysis_issues import (
    get_analysis_issue_by_user_id_and_issue_id as repo_get_analysis_issue_by_user_id_and_issue_id
)
from core.infrastructure.db.models.Issue import Issue
from core.infrastructure.db.models.AnalysisIssue import AnalysisIssue
from .dtos.issues_service_dto import CreateIssueDTO, UpdateIssueDTO, IssueResponseDTO
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
    """Get an issue by its ID with optional analysis_issue data for the user."""
    issue = repo_get_issue_by_id(issue_id, db_session)

    if not issue:
        raise NotFoundException(f"Issue with ID {issue_id} not found", str(issue_id))

    analysis_issue = _get_analysis_issue_for_user_and_issue(user_id, issue_id, db_session)
    return from_issue_to_response_dto(issue, analysis_issue)


def get_all_issues(user_id: UUID, db_session: Session) -> list[IssueResponseDTO]:
    """Get all issues with optional analysis_issue data for the user."""
    issues = repo_get_all_issues(db_session)
    return [from_issue_to_response_dto(issue, _get_analysis_issue_for_user_and_issue(user_id, issue.id, db_session)) for issue in issues]


def get_issues_by_analysis_id(analysis_id: UUID, user_id: UUID, db_session: Session) -> list[IssueResponseDTO]:
    """Get all issues associated with a specific analysis with optional analysis_issue data."""
    issues = repo_get_issues_by_analysis_id(analysis_id, db_session)

    return [from_issue_to_response_dto(issue, _get_analysis_issue_for_user_and_issue(user_id, issue.id, db_session)) for issue in issues]


def get_issues_by_drill_id(drill_id: UUID, user_id: UUID, db_session: Session) -> list[IssueResponseDTO]:
    """Get all issues associated with a specific drill with optional analysis_issue data."""
    issues = repo_get_issues_by_drill_id(drill_id, db_session)

    return [from_issue_to_response_dto(issue, _get_analysis_issue_for_user_and_issue(user_id, issue.id, db_session)) for issue in issues]


def get_issues_by_user_id(user_id: UUID, db_session: Session) -> list[IssueResponseDTO]:
    """Get all issues created by a specific user with analysis_issue data."""
    issues: list[Issue] = repo_get_issues_by_user_id(user_id, db_session)
    return [from_issue_to_response_dto(issue, _get_analysis_issue_for_user_and_issue(user_id, issue.id, db_session)) for issue in issues]


def update_issue(issue_id: UUID, dto: UpdateIssueDTO, db_session: Session) -> IssueResponseDTO | None:
    """Update an existing issue.

    Args:
        issue_id (UUID): The ID of the issue to update.
        dto (UpdateIssueDTO): The data to update the issue with.

    Returns:
        IssueResponseDTO: The updated issue data.
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
    return from_issue_to_response_dto(updated_issue)


def delete_issue(issue_id: UUID, db_session: Session) -> bool:
    """Delete an issue by its ID."""
    issue = repo_get_issue_by_id(issue_id, db_session)
    if not issue:
        raise NotFoundException(f"Issue ID not found", str(issue_id))
    repo_delete_issue(issue, db_session)


def delete_issues_bulk(issue_ids: list[UUID], db_session: Session) -> bool:
    """Delete multiple issues by their IDs."""
    issues = repo_get_issues_by_ids(issue_ids, db_session)
    if len(issues) != len(issue_ids):
        raise NotFoundException(f"One or more issues not found", str(issue_ids))
    repo_delete_issues(issues, db_session)

# ------------ Helper Methods ------------


def _get_analysis_issue_for_user_and_issue(user_id: UUID, issue_id: UUID, db_session: Session) -> AnalysisIssue | None:
    """Get the analysis_issue for a specific user and issue combination."""
    return repo_get_analysis_issue_by_user_id_and_issue_id(user_id, issue_id, db_session)


def from_issue_to_response_dto(issue: Issue, analysis_issue: AnalysisIssue | None = None) -> IssueResponseDTO:
    """Transform an Issue object to IssueResponseDTO with optional analysis_issue data."""
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
    )