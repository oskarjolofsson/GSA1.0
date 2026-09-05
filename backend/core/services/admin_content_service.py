"""Catalog administration: browse, author and retire issues and drills.

Everything here is admin-only and operates on the global catalog. It sits beside
issues_service and drill_service rather than replacing them — those serve the
golfer-facing API, this one serves the content editor and returns a wider DTO
(ownership, motion fields, linked records) that the app has no use for.

Writes reuse issue_authoring_service.persist_issue_with_drills so the catalog path
and the user-authoring path stay one implementation.
"""

from uuid import UUID

from sqlalchemy.orm import Session

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


def _to_admin_issue_dto(issue) -> AdminIssueDTO:
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


def _to_admin_drill_dto(drill) -> AdminDrillDTO:
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

    return DeleteImpactDTO(
        analysis_issues=issue_repo.count_analysis_issues_for_issue(issue_id, db_session),
        programs=issue_repo.count_programs_for_issue(issue_id, db_session),
        practice_sessions=issue_repo.count_practice_sessions_for_issue(
            issue_id, db_session
        ),
        mappings=issue_repo.count_drill_mappings_for_issue(issue_id, db_session),
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
    drill = drill_repo.add_drill(
        {
            "user_id": None,
            "title": title.strip(),
            "task": task.strip(),
            "success_signal": success_signal.strip(),
            "fault_indicator": fault_indicator.strip(),
            # Validated here so a bad value is a 422 naming the field, not a 500.
            "area": taxonomy.normalize_area_optional(area),
            "metric": drill_metrics.validate_metric(metric),
        },
        db_session,
    )
    return get_drill(drill.id, db_session)


#: Fields on a drill that are not free text, so `update_drill` must not `.strip()` them.
_DRILL_STRUCTURED_FIELDS = {"area", "metric"}


def update_drill(drill_id: UUID, fields: dict, db_session: Session) -> AdminDrillDTO:
    drill = drill_repo.get_drill_by_id(drill_id, db_session)
    if not drill:
        raise NotFoundException("Drill", str(drill_id))

    # area/metric are the only clearable fields, so None means "clear", not "skip".
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

    return DeleteImpactDTO(
        mappings=drill_repo.count_issue_mappings_for_drill(drill_id, db_session),
        program_drill_states=drill_repo.count_program_drill_states_for_drill(
            drill_id, db_session
        ),
        drill_runs=drill_repo.count_practice_drill_runs_for_drill(drill_id, db_session),
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

    issue_drill_repo.add_issue_drill(issue_id, drill_id, db_session)
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
    """Issue counts for every area/miss/goal cell, including empty ones.

    Cells come from the taxonomy rather than the data, so a combination with no issues
    still appears — the gap is the point. See ADR-0003 for the join and scoping choices.
    """
    counts = {
        (area, miss, goal): n
        for area, miss, goal, n in issue_repo.count_issues_by_area_miss_goal(db_session)
    }

    cells = [
        CoverageCellDTO(
            area=area, miss=miss, goal=goal, issue_count=counts.get((area, miss, goal), 0)
        )
        for area in taxonomy.allowed_areas()
        for miss in taxonomy.misses_for(area)
        for goal in taxonomy.allowed_goals()
    ]

    # Untagged issues key on NULL, which no (area, miss, goal) triple reaches.
    untagged = sum(
        n for (area, miss, goal), n in counts.items() if miss is None or goal is None
    )

    # A skill issue with no goals falls out of the library tree entirely (ADR-0003).
    goalless_skills = issue_repo.count_goalless_skill_issues(db_session)

    return CoverageDTO(
        cells=cells,
        unmapped_drills=drill_repo.get_unmapped_drills_count(db_session),
        issues_with_no_drills=issue_repo.get_issues_with_no_drills_count(db_session),
        untagged_issues=untagged,
        goalless_skill_issues=goalless_skills,
    )
