from fastapi import APIRouter, Depends, Body
from uuid import UUID
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from sqlalchemy.orm import Session

from app.api.v1.schemas.issue import (
    CreateIssueRequest,
    CreateIssueResponse,
    GetIssue,
    UpdateIssueRequest,
    BulkDeleteIssuesRequest,
)
from core.services.issues_service import (
    create_issue as service_create_issue,
    get_issue_by_id as service_get_issue_by_id,
    get_all_issues as service_get_all_issues,
    get_issues_by_analysis_id as service_get_issues_by_analysis_id,
    get_issues_by_drill_id as service_get_issues_by_drill_id,
    update_issue as service_update_issue,
    delete_issue as service_delete_issue,
    get_issues_by_user_id as service_get_issues_by_user_id,
    delete_issues_bulk as service_delete_issues_bulk,
)
from core.services.dtos.issues_service_dto import CreateIssueDTO, UpdateIssueDTO

router = APIRouter()


@router.post("/", response_model=CreateIssueResponse, status_code=201)
def create_issue(
    request: CreateIssueRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new issue.

    Arguments (JSON body):
        title (str): Issue title
        phase (str, optional): Swing phase (SETUP, BACKSWING, TRANSITION, DOWNSWING, IMPACT, FOLLOW_THROUGH)
        current_motion (str, optional): Current motion description
        expected_motion (str, optional): Expected motion description
        swing_effect (str, optional): Effect on swing
        shot_outcome (str, optional): Expected shot outcome
    """
    dto = CreateIssueDTO(
        title=request.title,
        phase=request.phase,
        current_motion=request.current_motion,
        expected_motion=request.expected_motion,
        swing_effect=request.swing_effect,
        shot_outcome=request.shot_outcome,
    )

    result = service_create_issue(dto=dto, db_session=db)

    return CreateIssueResponse(
        success=True,
        issue_id=result.id,
    )


@router.get("/all", response_model=list[GetIssue])
def get_all_issues(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get all issues.

    Returns:
        JSON response with a list of all issues
    """
    issues = service_get_all_issues(db_session=db)
    return [GetIssue.from_domain(issue) for issue in issues]


@router.get("/by-analysis/{analysis_id}", response_model=list[GetIssue])
def get_issues_by_analysis(
    analysis_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get all issues associated with a specific analysis.

    Arguments:
        analysis_id (UUID): Analysis identifier
        
    Returns:
        JSON response with a list of issues
    """
    issues = service_get_issues_by_analysis_id(analysis_id, db_session=db)

    return [GetIssue.from_domain(issue) for issue in issues]


@router.get("/by-drill/{drill_id}", response_model=list[GetIssue])
def get_issues_by_drill(
    drill_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get all issues associated with a specific drill.

    Arguments:
        drill_id (UUID): Drill identifier

    Returns:
        JSON response with a list of issues
    """
    issues = service_get_issues_by_drill_id(drill_id, db_session=db)

    return [GetIssue.from_domain(issue) for issue in issues]


@router.get("/", response_model=list[GetIssue])
def get_issues_by_user(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """
    Get all issues created by a specific user.

    Arguments:
        user_id (UUID): User identifier

    Returns:
        List of issues created by the user
    """
    issues = service_get_issues_by_user_id(current_user["user_id"], db_session=db)
    return [GetIssue.from_domain(issue) for issue in issues]


@router.get("/{issue_id}", response_model=GetIssue)
def get_issue(
    issue_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get details of a specific issue.

    Arguments:
        issue_id (UUID): Issue identifier

    Returns:
        JSON response with issue details
    """
    issue = service_get_issue_by_id(issue_id, db_session=db)

    return GetIssue.from_domain(issue)


@router.put("/{issue_id}", response_model=GetIssue)
def update_issue(
    issue_id: UUID,
    request: UpdateIssueRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Update an existing issue.

    Arguments:
        issue_id (UUID): Issue identifier
    
    Arguments (JSON body):
        title (str, optional): Issue title
        phase (str, optional): Swing phase
        current_motion (str, optional): Current motion description
        expected_motion (str, optional): Expected motion description
        swing_effect (str, optional): Effect on swing
        shot_outcome (str, optional): Expected shot outcome

    Returns:
        JSON response with updated issue details
    """
    dto = UpdateIssueDTO(
        title=request.title,
        phase=request.phase,
        current_motion=request.current_motion,
        expected_motion=request.expected_motion,
        swing_effect=request.swing_effect,
        shot_outcome=request.shot_outcome,
    )

    result = service_update_issue(issue_id, dto=dto, db_session=db)

    return GetIssue.from_domain(result)


@router.delete("/bulk", status_code=204)
def delete_issues_bulk(
    request: BulkDeleteIssuesRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Delete multiple issues.

    Arguments:
        issue_ids (list[UUID]): List of issue identifiers

    Returns:
        JSON response with success status
    """
    service_delete_issues_bulk(request.issue_ids, db_session=db)


@router.delete("/{issue_id}", status_code=204)
def delete_issue(
    issue_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a specific issue.

    Arguments:
        issue_id (UUID): Issue identifier

    Returns:
        JSON response with success status
    """
    service_delete_issue(issue_id, db_session=db)


