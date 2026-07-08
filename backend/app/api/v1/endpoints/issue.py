import base64
import binascii

from fastapi import APIRouter, Depends, Body, HTTPException
from uuid import UUID
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.require_admin import require_admin
from app.dependencies.entitlement import require_premium
from sqlalchemy.orm import Session

from app.api.v1.schemas.issue import (
    CreateIssueRequest,
    CreateIssueResponse,
    GetIssue,
    UpdateIssueRequest,
    BulkDeleteIssuesRequest,
    StructureFeedbackRequest,
    FeedbackDraftResponse,
    CreateCustomIssueRequest,
    CatalogIssueSchema,
)
from core.services import issue_authoring_service
from core.services.dtos.issue_authoring_service_dto import DraftIssueDTO, DraftDrillDTO
from core.services.issues_service import (
    create_issue as service_create_issue,
    get_issue_by_id as service_get_issue_by_id,
    get_all_issues as service_get_all_issues,
    get_issues_by_analysis_id as service_get_issues_by_analysis_id,
    get_issues_by_drill_id as service_get_issues_by_drill_id,
    update_issue as service_update_issue,
    delete_issue as service_delete_issue,
    get_issues_by_user_id as service_get_issues_by_user_id,
    get_todays_issue as service_get_todays_issue,
    delete_issues_bulk as service_delete_issues_bulk,
)
from core.services.dtos.issues_service_dto import CreateIssueDTO, UpdateIssueDTO

router = APIRouter()


@router.post("/", response_model=CreateIssueResponse, status_code=201)
def create_issue(
    request: CreateIssueRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
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
        description=request.description,
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


@router.get("/all/", response_model=list[GetIssue])
def get_all_issues(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Get all issues.

    Returns:
        JSON response with a list of all issues
    """
    issues = service_get_all_issues(current_user["user_id"], db_session=db)
    return [GetIssue.from_domain(issue) for issue in issues]


@router.get("/by-analysis/{analysis_id}/", response_model=list[GetIssue])
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
    issues = service_get_issues_by_analysis_id(analysis_id, current_user["user_id"], db_session=db)

    return [GetIssue.from_domain(issue) for issue in issues]


@router.get("/by-drill/{drill_id}/", response_model=list[GetIssue])
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
    issues = service_get_issues_by_drill_id(drill_id, current_user["user_id"], db_session=db)

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


@router.post("/structure-feedback/", response_model=FeedbackDraftResponse)
def structure_feedback(
    request: StructureFeedbackRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_premium),
):
    """
    Coach-feedback path (premium): format a real coach's lesson feedback into a
    draft Issue + Drills, plus any lookalike catalog issues for reuse. Persists
    nothing — the user reviews/edits, then confirms via POST /issues/custom/.
    """
    image_bytes = None
    if request.image_base64:
        try:
            image_bytes = base64.b64decode(request.image_base64, validate=True)
        except (binascii.Error, ValueError):
            raise HTTPException(status_code=422, detail="image_base64 is not valid base64.")

    draft = issue_authoring_service.structure_feedback(
        user_id=current_user["user_id"],
        text=request.text,
        db_session=db,
        image_bytes=image_bytes,
        image_mime=request.image_mime,
    )
    return FeedbackDraftResponse.from_domain(draft)


@router.post("/custom/", response_model=CatalogIssueSchema, status_code=201)
def create_custom_issue(
    request: CreateCustomIssueRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Persist a confirmed user-authored issue + drills. Start practicing it with
    POST /programs/generate/ {issue_id} (same path the browse flow uses).
    """
    issue = DraftIssueDTO(
        title=request.issue.title,
        description=request.issue.description,
        phase=request.issue.phase,
    )
    drills = [
        DraftDrillDTO(
            title=d.title,
            task=d.task,
            success_signal=d.success_signal,
            fault_indicator=d.fault_indicator,
            ai_filled=d.ai_filled,
        )
        for d in request.drills
    ]
    created = issue_authoring_service.create_custom_issue(
        user_id=current_user["user_id"],
        issue=issue,
        drills=drills,
        db_session=db,
    )
    return CatalogIssueSchema.from_domain(created)


@router.get("/catalog/", response_model=list[CatalogIssueSchema])
def get_issue_catalog(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Browseable library: the global catalog plus this user's own custom issues,
    each with its drills. Pick one and start it via POST /programs/generate/.
    """
    issues = issue_authoring_service.list_catalog_issues(current_user["user_id"], db)
    return [CatalogIssueSchema.from_domain(i) for i in issues]


@router.get("/todays-issue/", response_model=GetIssue | None)
def get_todays_issue(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get the issue the user should work today.

    Selection is decided server-side (currently the most-practiced issue) so the
    rule can change without a client release. Returns null when the user has no
    issues yet.

    NOTE: declared before /{issue_id}/ so "todays-issue" is not parsed as a UUID.
    """
    issue = service_get_todays_issue(current_user["user_id"], db_session=db)
    return GetIssue.from_domain(issue) if issue else None


@router.get("/{issue_id}/", response_model=GetIssue)
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
    issue = service_get_issue_by_id(issue_id, current_user["user_id"], db_session=db)

    return GetIssue.from_domain(issue)


@router.patch("/{issue_id}/", response_model=GetIssue)
def update_issue(
    issue_id: UUID,
    request: UpdateIssueRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
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
        description=request.description,
        current_motion=request.current_motion,
        expected_motion=request.expected_motion,
        swing_effect=request.swing_effect,
        shot_outcome=request.shot_outcome,
    )

    result = service_update_issue(issue_id, dto=dto, db_session=db)

    return GetIssue.from_domain(result)


@router.delete("/bulk/", status_code=204)
def delete_issues_bulk(
    request: BulkDeleteIssuesRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Delete multiple issues.

    Arguments:
        issue_ids (list[UUID]): List of issue identifiers

    Returns:
        JSON response with success status
    """
    service_delete_issues_bulk(request.issue_ids, db_session=db)


@router.delete("/{issue_id}/", status_code=204)
def delete_issue(
    issue_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Delete a specific issue.

    Arguments:
        issue_id (UUID): Issue identifier

    Returns:
        JSON response with success status
    """
    service_delete_issue(issue_id, db_session=db)


