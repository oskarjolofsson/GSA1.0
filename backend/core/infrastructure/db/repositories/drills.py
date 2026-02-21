from ..models.Drill import Drill
from ..models.Issue import Issue
from ..models.AnalysisIssue import AnalysisIssue
from ..models.IssueDrill import IssueDrill
from ..models.Analysis import Analysis
from sqlalchemy.orm import Session
from uuid import UUID

# ------------ GET ------------


def get_drill_by_id(drill_id, session: Session) -> Drill:
    return session.get(Drill, drill_id)


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