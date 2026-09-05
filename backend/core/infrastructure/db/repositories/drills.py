from ..models.Drill import Drill
from ..models.Issue import Issue
from ..models.AnalysisIssue import AnalysisIssue
from ..models.IssueDrill import IssueDrill
from ..models.Analysis import Analysis
from ..models.PracticeDrillRun import PracticeDrillRun
from ..models.ProgramDrillState import ProgramDrillState
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import delete, select, func, or_
from uuid import UUID

# ------------ GET ------------


def get_drill_by_id(drill_id, session: Session) -> Drill:
    return session.get(Drill, drill_id)


def get_drills_by_ids(drill_ids: list[UUID], session: Session) -> list[Drill]:
    return session.query(Drill).filter(Drill.id.in_(drill_ids)).all()


def get_all_drills(session: Session) -> list[Drill]:
    return session.query(Drill).all()


def get_drills_by_issue_id(issue_id: UUID, session: Session) -> list[Drill]:
    return (
        session.query(Drill)
        .join(IssueDrill, Drill.id == IssueDrill.drill_id)
        .filter(IssueDrill.issue_id == issue_id)
        .all()
    )
    
    
def get_drills_by_analysis_id(analysis_id: UUID, session: Session) -> list[Drill]:
    return (
        session.query(Drill)
        .join(IssueDrill, Drill.id == IssueDrill.drill_id)
        .join(Issue, IssueDrill.issue_id == Issue.id)
        .join(AnalysisIssue, Issue.id == AnalysisIssue.issue_id)
        .join(Analysis, AnalysisIssue.analysis_id == Analysis.id)
        .filter(Analysis.id == analysis_id)
        .distinct()
        .all()
    )
    
    
def get_drills_by_user_id(user_id: UUID, session: Session) -> list[Drill]:
    return (
        session.query(Drill)
        .join(IssueDrill, Drill.id == IssueDrill.drill_id)
        .join(Issue, IssueDrill.issue_id == Issue.id)
        .join(AnalysisIssue, Issue.id == AnalysisIssue.issue_id)
        .join(Analysis, AnalysisIssue.analysis_id == Analysis.id)
        .filter(Analysis.user_id == user_id)
        .distinct()
        .all()
    )


# ------------ CREATE ------------


def create_drill(drill: Drill, session: Session) -> Drill:
    session.add(drill)
    session.flush()
    return drill


# ------------ UPDATE ------------


def update_drill(drill: Drill, session: Session) -> Drill:
    session.add(drill)
    session.flush()
    return drill

# ------------ DELETE ------------

def delete_drill(drill: Drill, session: Session) -> None:
    session.delete(drill)
    session.flush()
    
    
def delete_drills(drills: list[Drill], session: Session) -> None:
    stmt = delete(Drill).where(Drill.id.in_([drill.id for drill in drills]))
    session.execute(stmt)
    session.flush()


# ------------ COUNT ------------


def get_drill_count(session: Session) -> int:
    """Get total count of drills."""
    stmt = select(func.count()).select_from(Drill)
    return session.scalar(stmt) or 0


def get_unmapped_drills_count(session: Session) -> int:
    """Get count of drills that have no issue mappings."""
    subquery = select(IssueDrill.drill_id).distinct()
    stmt = (
        select(func.count())
        .select_from(Drill)
        .where(Drill.id.notin_(subquery))
    )
    return session.scalar(stmt) or 0

# ------------ ADMIN LIST ------------

# Drills carry their linked issues so the admin can see what a drill is used by
# before editing or deleting it.
_ADMIN_DRILL_OPTS = (selectinload(Drill.issue_drills).selectinload(IssueDrill.issue),)


def _admin_drill_filters(q):
    """Shared by the page query and its count so the two cannot disagree."""
    if not q:
        return []
    like = f"%{q}%"
    return [or_(Drill.title.ilike(like), Drill.task.ilike(like))]


def get_drills_page_admin(
    session: Session, *, limit: int, offset: int, q: str | None = None
) -> list[Drill]:
    """One page of drills for the admin content list.

    Newest-first with id as a tiebreaker, so offset paging is stable.
    """
    stmt = (
        select(Drill)
        .where(*_admin_drill_filters(q))
        .order_by(Drill.created_at.desc(), Drill.id)
        .limit(limit)
        .offset(offset)
        .options(*_ADMIN_DRILL_OPTS)
    )
    return list(session.scalars(stmt).unique().all())


def count_drills_admin(session: Session, *, q: str | None = None) -> int:
    stmt = select(func.count()).select_from(Drill).where(*_admin_drill_filters(q))
    return session.scalar(stmt) or 0


def get_drill_with_issues(drill_id: UUID, session: Session) -> Drill | None:
    """A single drill with its linked issues eager-loaded, for the detail view."""
    return session.get(Drill, drill_id, options=_ADMIN_DRILL_OPTS)


# ------------ ADMIN: create and delete impact ------------


def add_drill(fields: dict, session: Session) -> Drill:
    """Insert a drill from already-validated fields."""
    drill = Drill(**fields)
    session.add(drill)
    session.flush()
    return drill


def count_issue_mappings_for_drill(drill_id: UUID, session: Session) -> int:
    """Issues prescribing this drill. CASCADEs on delete."""
    return session.scalar(
        select(func.count()).select_from(IssueDrill).where(IssueDrill.drill_id == drill_id)
    ) or 0


def count_program_drill_states_for_drill(drill_id: UUID, session: Session) -> int:
    """Per-program strength rows for this drill. CASCADEs on delete."""
    return session.scalar(
        select(func.count())
        .select_from(ProgramDrillState)
        .where(ProgramDrillState.drill_id == drill_id)
    ) or 0


def count_practice_drill_runs_for_drill(drill_id: UUID, session: Session) -> int:
    """Recorded runs of this drill. Its FK is ON DELETE SET NULL, so these survive the
    delete — the count says how much history stops naming what it was."""
    return session.scalar(
        select(func.count())
        .select_from(PracticeDrillRun)
        .where(PracticeDrillRun.drill_id == drill_id)
    ) or 0
