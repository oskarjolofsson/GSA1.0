"""Catalog administration: browse, author and retire issues and drills.

Everything here is admin-only and operates on the global catalog. It sits beside
issues_service and drill_service rather than replacing them — those serve the
golfer-facing API, this one serves the content editor and returns a wider DTO
(ownership, motion fields, linked records) that the app has no use for.

Writes reuse issue_authoring_service.persist_issue_with_drills so the catalog path
and the user-authoring path stay one implementation.
"""

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from core.infrastructure.db import models
from core.infrastructure.db.repositories import drills as drill_repo
from core.infrastructure.db.repositories import issue_drills as issue_drill_repo
from core.infrastructure.db.repositories import issues as issue_repo
from core.services import issue_authoring_service as authoring
from core.services import issues_service
from core.services.dtos.admin_content_dto import (
    AdminDrillDTO,
    AdminIssueDTO,
    AdminIssueRefDTO,
    CoverageCellDTO,
    CoverageDTO,
    DeleteImpactDTO,
)
from core.services.dtos.issue_authoring_service_dto import (
    CatalogDrillDTO,
    DraftDrillDTO,
    DraftIssueDTO,
)
from core.services.dtos.issues_service_dto import UpdateIssueDTO
from core.services.exceptions import ConflictException, NotFoundException
from core.services import drill_metrics, taxonomy


# ------------------------------ mapping ------------------------------


def _to_admin_issue_dto(issue: models.Issue) -> AdminIssueDTO:
    return AdminIssueDTO(
        id=issue.id,
        title=issue.title,
        description=issue.description,
        area=issue.area,
        kind=issue.kind,
        source=issue.source,
        user_id=issue.user_id,
        layman_title=issue.layman_title,
        layman_desc=issue.layman_desc,
        current_motion=issue.current_motion,
        expected_motion=issue.expected_motion,
        swing_effect=issue.swing_effect,
        shot_outcome=issue.shot_outcome,
        created_at=issue.created_at.isoformat() if issue.created_at else None,
        goals=[g.goal for g in issue.goals],
        misses=[m.miss for m in issue.misses],
        drills=[
            CatalogDrillDTO(
                id=link.drill.id,
                title=link.drill.title,
                task=link.drill.task,
                success_signal=link.drill.success_signal,
                fault_indicator=link.drill.fault_indicator,
            )
            for link in issue.issue_drills
        ],
    )


def _to_admin_drill_dto(drill: models.Drill) -> AdminDrillDTO:
    return AdminDrillDTO(
        id=drill.id,
        title=drill.title,
        task=drill.task,
        success_signal=drill.success_signal,
        fault_indicator=drill.fault_indicator,
        user_id=drill.user_id,
        created_at=drill.created_at.isoformat() if drill.created_at else None,
        area=drill.area,
        metric=drill.metric,
        issues=[
            AdminIssueRefDTO(id=link.issue.id, title=link.issue.title)
            for link in drill.issue_drills
        ],
    )


# ------------------------------ issues ------------------------------


def list_issues(
    db_session: Session,
    *,
    limit: int,
    offset: int,
    q: str | None = None,
    area: str | None = None,
    kind: str | None = None,
    source: str | None = None,
) -> tuple[list[AdminIssueDTO], int]:
    issues = issue_repo.get_issues_page_admin(
        db_session, limit=limit, offset=offset, q=q, area=area, kind=kind, source=source
    )
    total = issue_repo.count_issues_admin(
        db_session, q=q, area=area, kind=kind, source=source
    )
    return [_to_admin_issue_dto(i) for i in issues], total


def get_issue(issue_id: UUID, db_session: Session) -> AdminIssueDTO:
    issue = issue_repo.get_issue_with_drills(issue_id, db_session)
    if not issue:
        raise NotFoundException("Issue", str(issue_id))
    return _to_admin_issue_dto(issue)


def compose_issue(
    *,
    issue: DraftIssueDTO,
    new_drills: list[DraftDrillDTO],
    existing_drill_ids: list[UUID],
    motion_fields: dict,
    db_session: Session,
) -> AdminIssueDTO:
    """Create a catalog issue with its tags and drill links in one transaction."""
    created = authoring.persist_issue_with_drills(
        issue=issue,
        new_drills=new_drills,
        existing_drill_ids=existing_drill_ids,
        user_id=None,
        source="catalog",
        strict_tags=True,
        db_session=db_session,
    )
    _apply_motion_fields(created.id, motion_fields, db_session)
    return get_issue(created.id, db_session)


def _apply_motion_fields(issue_id: UUID, motion_fields: dict, db_session: Session) -> None:
    """The coach-vocabulary fields aren't part of the shared authoring DTO, so they
    are set directly after the issue exists. Same transaction, so still atomic."""
    if not any(v is not None for v in motion_fields.values()):
        return
    issue = issue_repo.get_issue_by_id(issue_id, db_session)
    for name, value in motion_fields.items():
        if value is not None:
            setattr(issue, name, value)
    issue_repo.update_issue(issue, db_session)


def update_issue(issue_id: UUID, fields: dict, db_session: Session) -> AdminIssueDTO:
    """Edit a catalog issue.

    Delegates to issues_service.update_issue, which owns the three-state field
    semantics and the strict tag validation, then re-reads through get_issue so the
    response carries the tags and drills the admin list expects.

    Works on user-authored issues too — that is the moderation path — and leaves
    their `source` and `user_id` alone, because neither is accepted here.
    """
    issues_service.update_issue(
        issue_id,
        UpdateIssueDTO(**fields),
        db_session,
    )
    return get_issue(issue_id, db_session)


def issue_delete_impact(issue_id: UUID, db_session: Session) -> DeleteImpactDTO:
    """Count what a delete of this issue would remove.

    analysis_issues, programs, issue_drill, issue_goals and issue_misses all CASCADE
    from issues; practice_sessions go transitively via analysis_issues.
    """
    if issue_repo.get_issue_by_id(issue_id, db_session) is None:
        raise NotFoundException("Issue", str(issue_id))

    def count(model, *where):
        return db_session.scalar(
            select(func.count()).select_from(model).where(*where)
        ) or 0

    analysis_issue_ids = select(models.AnalysisIssue.id).where(
        models.AnalysisIssue.issue_id == issue_id
    )
    return DeleteImpactDTO(
        analysis_issues=count(models.AnalysisIssue, models.AnalysisIssue.issue_id == issue_id),
        programs=count(models.Program, models.Program.issue_id == issue_id),
        practice_sessions=count(
            models.PracticeSession,
            models.PracticeSession.analysis_issue_id.in_(analysis_issue_ids),
        ),
        mappings=count(models.IssueDrill, models.IssueDrill.issue_id == issue_id),
    )


def delete_issue(issue_id: UUID, db_session: Session, *, confirm_impact: bool) -> None:
    """Delete a catalog issue.

    Refuses with 409 when anything references it and the caller has not confirmed,
    so a mistaken call cannot quietly cascade away a golfer's programs and history.
    """
    impact = issue_delete_impact(issue_id, db_session)
    if impact.blocking and not confirm_impact:
        raise ConflictException(
            "This issue is referenced by existing user data "
            f"({impact.programs} programs, {impact.practice_sessions} practice sessions, "
            f"{impact.analysis_issues} analyses). Re-send with confirm_impact=true to "
            "delete it and everything that depends on it."
        )
    issue = issue_repo.get_issue_by_id(issue_id, db_session)
    issue_repo.delete_issue(issue, db_session)


# ------------------------------ drills ------------------------------


def list_drills(
    db_session: Session, *, limit: int, offset: int, q: str | None = None
) -> tuple[list[AdminDrillDTO], int]:
    drills = drill_repo.get_drills_page_admin(db_session, limit=limit, offset=offset, q=q)
    total = drill_repo.count_drills_admin(db_session, q=q)
    return [_to_admin_drill_dto(d) for d in drills], total


def get_drill(drill_id: UUID, db_session: Session) -> AdminDrillDTO:
    drill = drill_repo.get_drill_with_issues(drill_id, db_session)
    if not drill:
        raise NotFoundException("Drill", str(drill_id))
    return _to_admin_drill_dto(drill)


def create_drill(
    *,
    title: str,
    task: str,
    success_signal: str,
    fault_indicator: str,
    area: str | None = None,
    metric: dict | None = None,
    db_session: Session,
) -> AdminDrillDTO:
    """A catalog drill: user_id stays NULL, which is what makes it global."""
    drill = models.Drill(
        user_id=None,
        title=title.strip(),
        task=task.strip(),
        success_signal=success_signal.strip(),
        fault_indicator=fault_indicator.strip(),
        # Both validated here rather than left to the column: a bad area is a 422 naming
        # the field instead of an IntegrityError surfacing as a 500, and a bad metric is
        # caught while the person who wrote it is still looking at the form.
        area=taxonomy.normalize_area_optional(area),
        metric=drill_metrics.validate_metric(metric),
    )
    drill_repo.create_drill(drill, db_session)
    return get_drill(drill.id, db_session)


#: Fields on a drill that are not free text, so `update_drill` must not `.strip()` them.
_DRILL_STRUCTURED_FIELDS = {"area", "metric"}


def update_drill(drill_id: UUID, fields: dict, db_session: Session) -> AdminDrillDTO:
    drill = drill_repo.get_drill_by_id(drill_id, db_session)
    if not drill:
        raise NotFoundException("Drill", str(drill_id))

    # `area` and `metric` are the only fields that can be *cleared*, so they read the
    # supplied keys rather than skipping on None: a drill that stops being scored has to
    # be able to go back to feel-only, and `None` is how the form says so.
    if "area" in fields:
        drill.area = taxonomy.normalize_area_optional(fields["area"])
    if "metric" in fields:
        drill.metric = drill_metrics.validate_metric(fields["metric"])

    for name, value in fields.items():
        if name not in _DRILL_STRUCTURED_FIELDS and value is not None:
            setattr(drill, name, value.strip())

    drill_repo.update_drill(drill, db_session)
    return get_drill(drill_id, db_session)


def drill_delete_impact(drill_id: UUID, db_session: Session) -> DeleteImpactDTO:
    """Count what a delete of this drill would touch.

    issue_drill and program_drill_states CASCADE. practice_drill_runs does not: its FK is
    ON DELETE SET NULL, so those runs outlive the drill. The count still matters — that is
    how much practice history stops naming what it was.
    """
    if drill_repo.get_drill_by_id(drill_id, db_session) is None:
        raise NotFoundException("Drill", str(drill_id))

    def count(model, *where):
        return db_session.scalar(
            select(func.count()).select_from(model).where(*where)
        ) or 0

    return DeleteImpactDTO(
        mappings=count(models.IssueDrill, models.IssueDrill.drill_id == drill_id),
        program_drill_states=count(
            models.ProgramDrillState, models.ProgramDrillState.drill_id == drill_id
        ),
        drill_runs=count(
            models.PracticeDrillRun, models.PracticeDrillRun.drill_id == drill_id
        ),
    )


def delete_drill(drill_id: UUID, db_session: Session, *, confirm_impact: bool) -> None:
    impact = drill_delete_impact(drill_id, db_session)
    if impact.refused_by_database:
        raise ConflictException(
            f"This drill has {impact.drill_runs} recorded practice runs and cannot be "
            "deleted; the database refuses it to preserve that history. Detach it from "
            "its issues instead so it stops being prescribed."
        )
    if impact.blocking and not confirm_impact:
        raise ConflictException(
            f"This drill is linked to {impact.mappings} issues and "
            f"{impact.program_drill_states} in-flight program states. Re-send with "
            "confirm_impact=true to delete it."
        )
    drill = drill_repo.get_drill_by_id(drill_id, db_session)
    drill_repo.delete_drill(drill, db_session)


# ------------------------------ links ------------------------------


def attach_drill(issue_id: UUID, drill_id: UUID, db_session: Session) -> AdminIssueDTO:
    if issue_repo.get_issue_by_id(issue_id, db_session) is None:
        raise NotFoundException("Issue", str(issue_id))
    if drill_repo.get_drill_by_id(drill_id, db_session) is None:
        raise NotFoundException("Drill", str(drill_id))

    existing = [
        link
        for link in issue_drill_repo.get_issue_drills_by_issue_id(issue_id, db_session)
        if str(link.drill_id) == str(drill_id)
    ]
    if existing:
        # uq_issue_drill would raise anyway; a clean 409 says why.
        raise ConflictException("That drill is already attached to this issue.")

    issue_drill_repo.create_issue_drill(
        models.IssueDrill(issue_id=issue_id, drill_id=drill_id), db_session
    )
    return get_issue(issue_id, db_session)


def detach_drill(issue_id: UUID, drill_id: UUID, db_session: Session) -> AdminIssueDTO:
    """Unlink a drill from an issue. The drill itself is left alone — it may be
    prescribed by other issues, and its practice history must survive."""
    links = [
        link
        for link in issue_drill_repo.get_issue_drills_by_issue_id(issue_id, db_session)
        if str(link.drill_id) == str(drill_id)
    ]
    if not links:
        raise NotFoundException("Issue-drill link", f"{issue_id}/{drill_id}")
    for link in links:
        issue_drill_repo.delete_issue_drill(link.id, db_session)
    return get_issue(issue_id, db_session)


# ------------------------------ coverage ------------------------------


def coverage(db_session: Session) -> CoverageDTO:
    """Issue counts per area / miss / goal, including the empty combinations.

    Cells are generated from the taxonomy rather than from the data, so a
    combination with no issues still appears — an absent row is exactly the gap
    worth seeing.

    Two things this deliberately does NOT do:

    Outer joins, not inner. An issue with no miss or goal tags used to produce zero rows
    and vanish from the grid entirely — invisible in the one tool built to find untagged
    content. With ~30 issues to author across four new areas that stops being a curiosity
    and becomes the main thing you would want the grid to show you.

    Cells scoped by area, not a cross-product. Misses belong to exactly one area now, so
    iterating every area against every miss would emit CHIPPING x SLICE and similar —
    permanently unfillable cells that read as gaps forever. The old shape produced
    5 x 8 x 6 = 240 cells, most of them nonsense.
    """
    rows = db_session.execute(
        select(
            models.Issue.area,
            models.IssueMiss.miss,
            models.IssueGoal.goal,
            func.count(func.distinct(models.Issue.id)),
        )
        .select_from(models.Issue)
        .outerjoin(models.IssueMiss, models.IssueMiss.issue_id == models.Issue.id)
        .outerjoin(models.IssueGoal, models.IssueGoal.issue_id == models.Issue.id)
        .group_by(models.Issue.area, models.IssueMiss.miss, models.IssueGoal.goal)
    ).all()
    counts = {(r[0], r[1], r[2]): r[3] for r in rows}

    cells = [
        CoverageCellDTO(
            area=area, miss=miss, goal=goal, issue_count=counts.get((area, miss, goal), 0)
        )
        for area in taxonomy.allowed_areas()
        for miss in taxonomy.misses_for(area)
        for goal in taxonomy.allowed_goals()
    ]

    # Issues carrying no miss or goal at all. The outer joins above give them a cell keyed
    # on NULL, which no (area, miss, goal) triple can reach, so surface the count directly
    # rather than letting them disappear again a layer up.
    untagged = sum(
        n for (area, miss, goal), n in counts.items() if miss is None or goal is None
    )

    return CoverageDTO(
        cells=cells,
        unmapped_drills=drill_repo.get_unmapped_drills_count(db_session),
        issues_with_no_drills=issue_repo.get_issues_with_no_drills_count(db_session),
        untagged_issues=untagged,
    )
