from sqlalchemy.orm import Session
from uuid import UUID

from core.infrastructure.db.repositories.issue_drills import (
    get_issue_drill_by_id as repo_get_issue_drill_by_id,
    get_issue_drills_by_issue_id as repo_get_issue_drills_by_issue_id,
    get_issue_drills_by_drill_id as repo_get_issue_drills_by_drill_id,
    create_issue_drill as repo_create_issue_drill,
    delete_issue_drill as repo_delete_issue_drill,
)
from core.infrastructure.db.models.IssueDrill import IssueDrill
from .dtos.issue_drill_service_dto import CreateIssueDrillDTO, IssueDrillResponseDTO
from core.services.exceptions import NotFoundException


def create_issue_drill(dto: CreateIssueDrillDTO, db_session: Session) -> IssueDrillResponseDTO:
    """Create a new issue-drill link."""
    new_issue_drill = IssueDrill(
        issue_id=dto.issue_id,
        drill_id=dto.drill_id,
    )
    created_issue_drill = repo_create_issue_drill(new_issue_drill, db_session)
    return from_issue_drill_to_response_dto(created_issue_drill)


def get_issue_drill_by_id(issue_drill_id: UUID, db_session: Session) -> IssueDrillResponseDTO:
    """Get an issue-drill link by its ID."""
    issue_drill = repo_get_issue_drill_by_id(issue_drill_id, db_session)
    if not issue_drill:
        raise NotFoundException(f"IssueDrill with ID {issue_drill_id} not found", str(issue_drill_id))
    return from_issue_drill_to_response_dto(issue_drill)


def get_issue_drills_by_issue_id(issue_id: UUID, db_session: Session) -> list[IssueDrillResponseDTO]:
    """Get all issue-drill links for a specific issue."""
    issue_drills = repo_get_issue_drills_by_issue_id(issue_id, db_session)
    return [from_issue_drill_to_response_dto(id) for id in issue_drills]


def get_issue_drills_by_drill_id(drill_id: UUID, db_session: Session) -> list[IssueDrillResponseDTO]:
    """Get all issue-drill links for a specific drill."""
    issue_drills = repo_get_issue_drills_by_drill_id(drill_id, db_session)
    return [from_issue_drill_to_response_dto(id) for id in issue_drills]


def delete_issue_drill(issue_drill_id: UUID, db_session: Session) -> None:
    """Delete an issue-drill link by its ID."""
    issue_drill = repo_get_issue_drill_by_id(issue_drill_id, db_session)
    if not issue_drill:
        raise NotFoundException(f"IssueDrill with ID {issue_drill_id} not found", str(issue_drill_id))
    repo_delete_issue_drill(issue_drill_id, db_session)


def from_issue_drill_to_response_dto(issue_drill: IssueDrill) -> IssueDrillResponseDTO:
    """Convert an IssueDrill model to response DTO."""
    return IssueDrillResponseDTO(
        id=issue_drill.id,
        issue_id=issue_drill.issue_id,
        drill_id=issue_drill.drill_id,
        created_at=issue_drill.created_at,
    )
