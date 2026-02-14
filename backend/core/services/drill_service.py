from requests import session
from uuid import UUID

from core.infrastructure.db.repositories.drills import (
    get_drill_by_id as repo_get_drill_by_id,
    create_drill as repo_create_drill,
    update_drill as repo_update_drill,
    delete_drill as repo_delete_drill,
    get_drills_by_issue_id as repo_get_drills_by_issue_id,
    get_drills_by_analysis_id as repo_get_drills_by_analysis_id,
    get_drills_by_user_id as repo_get_drills_by_user_id,
)
from core.infrastructure.db.models.Drill import Drill
from .dtos.drill_service_dto import CreateDrillDTO, UpdateDrillDTO, DrillResponseDTO
from ..infrastructure.db.session import SessionLocal

def create_drill(dto: CreateDrillDTO, db_session) -> DrillResponseDTO:
    new_drill = Drill(
        title=dto.title,
        task=dto.task,
        success_signal=dto.success_signal,
        fault_indicator=dto.fault_indicator,
    )

    created_drill = repo_create_drill(new_drill, db_session)

    return from_drill_to_response_dto(created_drill)


def get_drill_by_id(drill_id: UUID, db_session) -> DrillResponseDTO | None:
    drill = repo_get_drill_by_id(drill_id, db_session)

    if not drill:
        return None

    return from_drill_to_response_dto(drill)


def get_drills_by_user_id(user_id: UUID, db_session) -> list[DrillResponseDTO]:
    drills = repo_get_drills_by_user_id(user_id, db_session)

    return [from_drill_to_response_dto(drill) for drill in drills]


def get_drills_by_analysis_id(analysis_id: UUID, db_session) -> list[DrillResponseDTO]:
    drills = repo_get_drills_by_analysis_id(analysis_id, db_session)

    return [from_drill_to_response_dto(drill) for drill in drills]


def get_drills_by_issue_id(issue_id: UUID, db_session) -> list[DrillResponseDTO]:
    drills = repo_get_drills_by_issue_id(issue_id, db_session)

    return [from_drill_to_response_dto(drill) for drill in drills]



def update_drill(drill_id: UUID, dto: UpdateDrillDTO, db_session) -> DrillResponseDTO | None:
    """Update an existing drill.

    Args:
        drill_id (UUID): The ID of the drill to update.
        dto (UpdateDrillDTO): The data to update the drill with.

    Returns:
        DrillResponseDTO: The updated drill data.
    """
    drill = repo_get_drill_by_id(drill_id, db_session)

    if not drill:
        return None

    # Only update fields that are provided
    if dto.title is not None:
        drill.title = dto.title
    if dto.task is not None:
        drill.task = dto.task
    if dto.success_signal is not None:
        drill.success_signal = dto.success_signal
    if dto.fault_indicator is not None:
        drill.fault_indicator = dto.fault_indicator

    updated_drill = repo_update_drill(drill, db_session)

    return from_drill_to_response_dto(updated_drill)


def delete_drill(drill_id: UUID, db_session) -> bool:
    drill = repo_get_drill_by_id(drill_id, db_session)

    if not drill:
        return False

    repo_delete_drill(drill, db_session)

    return True


# ------------ Helper Methods ------------


def from_drill_to_response_dto(drill: Drill) -> DrillResponseDTO:
    return DrillResponseDTO(
        id=drill.id,
        title=drill.title,
        task=drill.task,
        success_signal=drill.success_signal,
        fault_indicator=drill.fault_indicator,
        created_at=drill.created_at,
    )
