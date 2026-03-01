from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID

from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from sqlalchemy.orm import Session

from app.api.v1.schemas.issue_drill import (
    CreateIssueDrillRequest,
    CreateIssueDrillResponse,
    GetIssueDrill,
    DeleteIssueDrillResponse,
)
from core.services.issue_drill_service import (
    create_issue_drill as service_create_issue_drill,
    get_issue_drill_by_id as service_get_issue_drill_by_id,
    get_issue_drills_by_issue_id as service_get_issue_drills_by_issue_id,
    get_issue_drills_by_drill_id as service_get_issue_drills_by_drill_id,
    delete_issue_drill as service_delete_issue_drill,
)
from core.services.dtos.issue_drill_service_dto import CreateIssueDrillDTO
from core.services.exceptions import NotFoundException

router = APIRouter()


@router.post("/", response_model=CreateIssueDrillResponse, status_code=201)
def create_issue_drill(
    request: CreateIssueDrillRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Create a new issue-drill link.

    Arguments (JSON body):
        issue_id (UUID): ID of the issue
        drill_id (UUID): ID of the drill

    Returns:
        JSON response with:
        - success
        - issue_drill_id
    """
    dto = CreateIssueDrillDTO(
        issue_id=request.issue_id,
        drill_id=request.drill_id,
    )

    result = service_create_issue_drill(dto=dto, db_session=db)

    return CreateIssueDrillResponse(
        success=True,
        issue_drill_id=result.id,
    )


@router.get("/{issue_drill_id}", response_model=GetIssueDrill)
def get_issue_drill_by_id(
    issue_drill_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Get an issue-drill link by its ID.

    Arguments:
        issue_drill_id (UUID): ID of the issue-drill link

    Returns:
        JSON response with the issue-drill link details
    """
    try:
        issue_drill = service_get_issue_drill_by_id(issue_drill_id, db_session=db)
        return GetIssueDrill.from_domain(issue_drill)
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/issue/{issue_id}", response_model=list[GetIssueDrill])
def get_issue_drills_by_issue_id(
    issue_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Get all issue-drill links for a specific issue.

    Arguments:
        issue_id (UUID): ID of the issue

    Returns:
        JSON response with a list of issue-drill links
    """
    issue_drills = service_get_issue_drills_by_issue_id(issue_id, db_session=db)
    return [GetIssueDrill.from_domain(id) for id in issue_drills]


@router.get("/drill/{drill_id}", response_model=list[GetIssueDrill])
def get_issue_drills_by_drill_id(
    drill_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Get all issue-drill links for a specific drill.

    Arguments:
        drill_id (UUID): ID of the drill

    Returns:
        JSON response with a list of issue-drill links
    """
    issue_drills = service_get_issue_drills_by_drill_id(drill_id, db_session=db)
    return [GetIssueDrill.from_domain(id) for id in issue_drills]


@router.delete("/{issue_drill_id}", response_model=DeleteIssueDrillResponse)
def delete_issue_drill(
    issue_drill_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Delete an issue-drill link by its ID.

    Arguments:
        issue_drill_id (UUID): ID of the issue-drill link to delete

    Returns:
        JSON response with:
        - success
    """
    try:
        service_delete_issue_drill(issue_drill_id, db_session=db)
        return DeleteIssueDrillResponse(success=True)
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
