

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
#from core.infrastructure.db.repositories.analysis_issues import get_analysis_issue_by_user_id
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


def get_issue_by_id(issue_id: UUID, db_session: Session) -> IssueResponseDTO | None:
    """Get an issue by its ID."""
    issue = repo_get_issue_by_id(issue_id, db_session)

    if not issue:
        raise NotFoundException(f"Issue with ID {issue_id} not found", str(issue_id))

    return from_issue_to_response_dto(issue)


def get_all_issues(db_session: Session) -> list[IssueResponseDTO]:
    """Get all issues."""
    issues = repo_get_all_issues(db_session)
    return [from_issue_to_response_dto(issue) for issue in issues]


def get_issues_by_analysis_id(analysis_id: UUID, db_session: Session) -> list[IssueResponseDTO]:
    """Get all issues associated with a specific analysis."""
    issues = repo_get_issues_by_analysis_id(analysis_id, db_session)

    return [from_issue_to_response_dto(issue) for issue in issues]


def get_issues_by_drill_id(drill_id: UUID, db_session: Session) -> list[IssueResponseDTO]:
    """Get all issues associated with a specific drill."""
    issues = repo_get_issues_by_drill_id(drill_id, db_session)

    return [from_issue_to_response_dto(issue) for issue in issues]


def get_issues_by_user_id(user_id: UUID, db_session: Session) -> list[IssueResponseDTO]:
    """Get all issues created by a specific user.""" 
    #analysis_issues: list[AnalysisIssue] = get_analysis_issue_by_user_id(user_id, db_session)
    issues: list[Issue] = repo_get_issues_by_user_id(user_id, db_session)
    return [from_issue_to_response_dto(issue) for issue in issues]


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


def from_issue_to_response_dto(issue: Issue) -> IssueResponseDTO:
    """Transform an Issue object to IssueResponseDTO."""
    return IssueResponseDTO(
        id=issue.id,
        title=issue.title,
        phase=issue.phase,
        current_motion=issue.current_motion,
        expected_motion=issue.expected_motion,
        swing_effect=issue.swing_effect,
        shot_outcome=issue.shot_outcome,
        created_at=issue.created_at.isoformat() if issue.created_at else None,
    )