from ..models.Drill import Drill
from ..models.Issue import Issue
from ..models.AnalysisIssue import AnalysisIssue
from ..models.IssueDrill import IssueDrill
from ..models.Analysis import Analysis
from sqlalchemy.orm import Session
from sqlalchemy import delete, select, func
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