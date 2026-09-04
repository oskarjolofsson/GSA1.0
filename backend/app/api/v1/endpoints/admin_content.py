"""Content catalog administration.

Its own router, mounted at /admin/content, rather than more routes on /issues/ and
/drills/. Those files already mix three auth levels and carry a route-ordering trap
(literal segments have to be declared before /{issue_id}/ or they parse as a UUID).
Everything here is require_admin, which mirrors admin_subscriptions.py.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.v1.schemas.admin_content import (
    AdminDrillPageResponse,
    AdminDrillSchema,
    AdminIssuePageResponse,
    AdminIssueSchema,
    ComposeIssueRequest,
    CoverageCellSchema,
    CoverageResponse,
    CreateAdminDrillRequest,
    DeleteImpactResponse,
    UpdateAdminDrillRequest,
    UpdateAdminIssueRequest,
)
from app.dependencies.db import get_db
from app.dependencies.require_admin import require_admin
from core.services import admin_content_service as service
from core.services.dtos.issue_authoring_service_dto import DraftDrillDTO, DraftIssueDTO

router = APIRouter()

MAX_PAGE_SIZE = 100


def _impact_response(impact) -> DeleteImpactResponse:
    return DeleteImpactResponse(
        analysis_issues=impact.analysis_issues,
        programs=impact.programs,
        practice_sessions=impact.practice_sessions,
        drill_runs=impact.drill_runs,
        mappings=impact.mappings,
        blocking=impact.blocking,
    )


# ------------------------------ issues ------------------------------


@router.get("/issues/", response_model=AdminIssuePageResponse)
def list_issues(
    limit: int = Query(25, ge=1, le=MAX_PAGE_SIZE),
    offset: int = Query(0, ge=0),
    q: str | None = None,
    area: str | None = None,
    kind: str | None = None,
    source: str | None = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """
    One page of catalog issues with their tags and drills.

    Arguments (query):
        limit/offset: page window, newest first
        q: substring match on title, description or layman_title
        area/kind/source: exact-match filters
    """
    items, total = service.list_issues(
        db, limit=limit, offset=offset, q=q, area=area, kind=kind, source=source
    )
    return AdminIssuePageResponse(
        items=[AdminIssueSchema.from_domain(i) for i in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/issues/{issue_id}/", response_model=AdminIssueSchema)
def get_issue(
    issue_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    return AdminIssueSchema.from_domain(service.get_issue(issue_id, db))


@router.post("/issues/", response_model=AdminIssueSchema, status_code=201)
def compose_issue(
    request: ComposeIssueRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """
    Create a catalog issue together with its tags, new drills and links to existing
    drills, in one request.

    Everything shares the request transaction, so a failure anywhere — an unknown
    tag, a drill id that does not resolve — leaves no partial issue behind.

    Unknown area/kind/tag values return 422. Allowed values: GET /api/v1/taxonomy/.
    """
    return AdminIssueSchema.from_domain(
        service.compose_issue(
            issue=DraftIssueDTO(
                title=request.title,
                description=request.description,
                area=request.area,
                kind=request.kind,
                misses=request.misses,
                goals=request.goals,
                layman_title=request.layman_title,
                layman_desc=request.layman_desc,
            ),
            new_drills=[
                DraftDrillDTO(
                    title=d.title,
                    task=d.task,
                    success_signal=d.success_signal,
                    fault_indicator=d.fault_indicator,
                )
                for d in request.new_drills
            ],
            existing_drill_ids=request.existing_drill_ids,
            motion_fields={
                "current_motion": request.current_motion,
                "expected_motion": request.expected_motion,
                "swing_effect": request.swing_effect,
                "shot_outcome": request.shot_outcome,
            },
            db_session=db,
        )
    )


@router.patch("/issues/{issue_id}/", response_model=AdminIssueSchema)
def update_issue(
    issue_id: UUID,
    request: UpdateAdminIssueRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """
    Edit a catalog issue. Partial: omitted fields are left untouched.

    Three-state on the nullable text fields — omit to keep, "" to clear, text to
    set. Tags behave the same: omit to keep, [] to remove them all, a list to
    replace the set. Without the "" case there would be no way to remove copy once
    written, and the save would report success while changing nothing.

    Unknown area/kind/tag values return 422 naming the value, and nothing is
    written. Allowed values: GET /api/v1/taxonomy/.

    Editing a user-authored issue is permitted — it is the moderation path — and
    leaves its `source` and `user_id` alone, neither being accepted here.
    """
    return AdminIssueSchema.from_domain(
        service.update_issue(issue_id, request.model_dump(exclude_unset=True), db)
    )


@router.get("/issues/{issue_id}/impact/", response_model=DeleteImpactResponse)
def issue_delete_impact(
    issue_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """
    What deleting this issue would remove. Read-only.

    Analyses, programs and practice sessions all CASCADE from an issue, so these
    counts are real user data that would be destroyed.
    """
    return _impact_response(service.issue_delete_impact(issue_id, db))


@router.delete("/issues/{issue_id}/", status_code=204)
def delete_issue(
    issue_id: UUID,
    confirm_impact: bool = Query(
        False,
        description="Required when the issue is referenced; without it the request "
        "is refused with 409.",
    ),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """
    Delete a catalog issue and everything that depends on it.

    Refuses with 409 while the issue is still referenced by user data, unless
    `confirm_impact` is set — a mistaken call would otherwise quietly cascade away
    golfers' programs, practice sessions and analysis history. Call the impact
    endpoint first to show the operator what they are about to destroy.
    """
    service.delete_issue(issue_id, db, confirm_impact=confirm_impact)


# ------------------------------ drills ------------------------------


@router.get("/drills/", response_model=AdminDrillPageResponse)
def list_drills(
    limit: int = Query(25, ge=1, le=MAX_PAGE_SIZE),
    offset: int = Query(0, ge=0),
    q: str | None = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """One page of drills, each with the issues that prescribe it."""
    items, total = service.list_drills(db, limit=limit, offset=offset, q=q)
    return AdminDrillPageResponse(
        items=[AdminDrillSchema.from_domain(d) for d in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/drills/{drill_id}/", response_model=AdminDrillSchema)
def get_drill(
    drill_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    return AdminDrillSchema.from_domain(service.get_drill(drill_id, db))


@router.post("/drills/", response_model=AdminDrillSchema, status_code=201)
def create_drill(
    request: CreateAdminDrillRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Create a global catalog drill. It is unattached until linked to an issue."""
    return AdminDrillSchema.from_domain(
        service.create_drill(
            title=request.title,
            task=request.task,
            success_signal=request.success_signal,
            fault_indicator=request.fault_indicator,
            area=request.area,
            metric=request.metric,
            db_session=db,
        )
    )


@router.patch("/drills/{drill_id}/", response_model=AdminDrillSchema)
def update_drill(
    drill_id: UUID,
    request: UpdateAdminDrillRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Partial update; omitted fields are left untouched.

    `exclude_unset` is load-bearing now that `area` and `metric` are nullable. They are
    the only fields that can be *cleared*, so the service distinguishes "sent as null"
    from "not sent" — dumping unset keys as None would silently strip a drill's metric
    on any patch that only touched its title.
    """
    return AdminDrillSchema.from_domain(
        service.update_drill(drill_id, request.model_dump(exclude_unset=True), db)
    )


@router.get("/drills/{drill_id}/impact/", response_model=DeleteImpactResponse)
def drill_delete_impact(
    drill_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """
    What deleting this drill would touch.

    `drill_runs` no longer blocks: practice_drill_runs is ON DELETE SET NULL, so those
    sessions survive and keep counting toward the streak. They just stop naming the drill,
    which is why the count is still worth showing before confirming.
    """
    return _impact_response(service.drill_delete_impact(drill_id, db))


@router.delete("/drills/{drill_id}/", status_code=204)
def delete_drill(
    drill_id: UUID,
    confirm_impact: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """
    Delete a catalog drill and detach it from every issue that prescribes it.

    Refuses with 409 while the drill is still referenced, unless `confirm_impact`
    is set; see the impact endpoint for what a confirmed delete would remove.
    """
    service.delete_drill(drill_id, db, confirm_impact=confirm_impact)


# ------------------------------ links ------------------------------


@router.post("/issues/{issue_id}/drills/{drill_id}/", response_model=AdminIssueSchema)
def attach_drill(
    issue_id: UUID,
    drill_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Prescribe an existing drill for an issue. 409 if already attached."""
    return AdminIssueSchema.from_domain(service.attach_drill(issue_id, drill_id, db))


@router.delete("/issues/{issue_id}/drills/{drill_id}/", response_model=AdminIssueSchema)
def detach_drill(
    issue_id: UUID,
    drill_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Unlink a drill from an issue. The drill and its practice history survive."""
    return AdminIssueSchema.from_domain(service.detach_drill(issue_id, drill_id, db))


# ------------------------------ coverage ------------------------------


@router.get("/coverage/", response_model=CoverageResponse)
def coverage(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """
    Issue counts across every area / miss / goal combination, plus the two catalog
    health counts already tracked by /admin/stats/.

    Cells with issue_count 0 are gaps: a golfer choosing that goal and miss has
    nothing to practise.
    """
    dto = service.coverage(db)
    return CoverageResponse(
        cells=[
            CoverageCellSchema(
                area=c.area, miss=c.miss, goal=c.goal, issue_count=c.issue_count
            )
            for c in dto.cells
        ],
        unmapped_drills=dto.unmapped_drills,
        issues_with_no_drills=dto.issues_with_no_drills,
        untagged_issues=dto.untagged_issues,
        goalless_skill_issues=dto.goalless_skill_issues,
    )
