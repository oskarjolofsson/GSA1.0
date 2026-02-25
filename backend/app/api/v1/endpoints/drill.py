from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID

from flask import request
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from sqlalchemy.orm import Session

from app.api.v1.schemas.drill import (
    CreateDrillRequest,
    CreateDrillResponse,
    GetDrill,
    UpdateDrillRequest,
    BulkDeleteDrillsRequest,
)
from core.services.drill_service import (
    create_drill as service_create_drill,
    get_drill_by_id as service_get_drill_by_id,
    get_drills_by_analysis_id as service_get_drills_by_analysis_id,
    get_drills_by_issue_id as service_get_drills_by_issue_id,
    get_drills_by_user_id as service_get_drills_by_user_id,
    get_all_drills as service_get_all_drills,
    update_drill as service_update_drill,
    delete_drill as service_delete_drill,
    bulk_delete_drills as service_bulk_delete_drills,
)
from core.services.dtos.drill_service_dto import CreateDrillDTO, UpdateDrillDTO

router = APIRouter()


@router.post("/", response_model=CreateDrillResponse, status_code=201)
def create_drill(
    request: CreateDrillRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new drill.

    Arguments (JSON body):
        title (str): Title of the drill
        task (str): Description of the drill task
        success_signal (str): Description of what indicates a successful drill
        fault_indicator (str): Description of what indicates a failed drill 
        
    Returns:
        JSON response with:
        - success
        - drill_id
    """
    dto = CreateDrillDTO(
        title=request.title,
        task=request.task,
        success_signal=request.success_signal,
        fault_indicator=request.fault_indicator,
    )

    result = service_create_drill(dto=dto, db_session=db)

    return CreateDrillResponse(
        success=True,
        drill_id=result.id,
    )
    
    
@router.get("/all", response_model=list[GetDrill])
def get_all_drills(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get all drills (admin endpoint).

    Returns:
        JSON response with a list of all drills
    """
    drills = service_get_all_drills(db_session=db)
    return [GetDrill.from_domain(drill) for drill in drills]


@router.get("/by-analysis/{analysis_id}", response_model=list[GetDrill])
def get_drills_by_analysis(
    analysis_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get all drills associated with a specific analysis.

    Arguments:
        analysis_id (UUID): Analysis identifier

    Returns:
        JSON response with a list of drills
    """
    drills = service_get_drills_by_analysis_id(analysis_id, db_session=db)

    return [GetDrill.from_domain(drill) for drill in drills]


@router.get("/by-issue/{issue_id}", response_model=list[GetDrill])
def get_drills_by_issue(
    issue_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get all drills associated with a specific issue.

    Arguments:
        issue_id (UUID): Issue identifier

    Returns:
        JSON response with a list of drills
    """
    drills = service_get_drills_by_issue_id(issue_id, db_session=db)

    return [GetDrill.from_domain(drill) for drill in drills]


@router.get("/by-user/{user_id}", response_model=list[GetDrill])
def get_drills_by_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get all drills associated with a specific user.

    Arguments:
        user_id (UUID): User identifier

    Returns:
        JSON response with a list of drills
    """
    drills = service_get_drills_by_user_id(user_id, db_session=db)

    return [GetDrill.from_domain(drill) for drill in drills]


@router.get("/{drill_id}", response_model=GetDrill)
def get_drill(
    drill_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get details of a specific drill.

    Arguments:
        drill_id (UUID): Drill identifier

    Returns:
        JSON response with drill details
    """
    drill = service_get_drill_by_id(drill_id, db_session=db)
    
    if not drill:
        raise HTTPException(status_code=404, detail="Drill not found")

    return GetDrill.from_domain(drill)


# ONLY FOR INTERNAL USE, NOT EXPOSED TO FRONTEND AND PROTECTED BY AUTHENTICATION
@router.put("/{drill_id}", response_model=GetDrill)
def update_drill(
    drill_id: UUID,
    request: UpdateDrillRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Update an existing drill.

    Arguments:
        drill_id (UUID): Drill identifier

    JSON body:
        title (str, optional): Updated title of the drill
        task (str, optional): Updated description of the drill task
        success_signal (str, optional): Updated description of what indicates a successful drill
        fault_indicator (str, optional): Updated description of what indicates a failed drill 

    Returns:
        JSON response with updated drill details
    """
    dto = UpdateDrillDTO(
        title=request.title,
        task=request.task,
        success_signal=request.success_signal,
        fault_indicator=request.fault_indicator,
    )

    result = service_update_drill(drill_id, dto=dto, db_session=db)
    
    if not result:
        raise HTTPException(status_code=404, detail="Drill not found")

    return GetDrill.from_domain(result)


# ONLY FOR INTERNAL USE, NOT EXPOSED TO FRONTEND AND PROTECTED BY AUTHENTICATION
@router.delete("/{drill_id}", status_code=204)
def delete_drill(
    drill_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a specific drill.

    Arguments:
        drill_id (UUID): Drill identifier

    Returns:
        JSON response with success status
    """
    service_delete_drill(drill_id, db_session=db)
    


# ONLY FOR INTERNAL USE, NOT EXPOSED TO FRONTEND AND PROTECTED BY AUTHENTICATION
@router.delete("/bulk", status_code=204)
def bulk_delete_drills(
    request: BulkDeleteDrillsRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete multiple drills.

    Arguments:
        request (BulkDeleteDrillsRequest): Request body with list of drill IDs to delete

    Returns:
        JSON response with success status
    """
    service_bulk_delete_drills(request.drill_ids, db_session=db)
    