from core.infrastructure.db import models
from ..models.AnalysisIssue import AnalysisIssue
from ..models.IssueDrill import IssueDrill
from ..models.Analysis import Analysis
from sqlalchemy.orm import Session
from uuid import UUID
from sqlalchemy import delete, select, func

# ------------ GET ------------


def get_issue_by_id(issue_id: UUID, session: Session) -> models.Issue:
    return session.get(models.Issue, issue_id)


def get_issues_by_ids(issue_ids: list[UUID], session: Session) -> list[models.Issue]:
    return session.query(models.Issue).filter(models.Issue.id.in_(issue_ids)).all()


def get_all_issues(session: Session) -> list[models.Issue]:
    return session.query(models.Issue).all()


def get_issues_by_analysis_id(analysis_id: UUID, session: Session) -> list[models.Issue]:
    """Get all issues associated with a specific analysis through the analysis_issues junction table."""
    return (
        session.query(models.Issue)
        .join(AnalysisIssue, models.Issue.id == AnalysisIssue.issue_id)
        .filter(AnalysisIssue.analysis_id == analysis_id)
        .all()
    )


def get_issues_by_drill_id(drill_id: UUID, session: Session) -> list[models.Issue]:
    """Get all issues associated with a specific drill through the issue_drill junction table."""
    return (
        session.query(models.Issue)
        .join(IssueDrill, models.Issue.id == IssueDrill.issue_id)
        .filter(IssueDrill.drill_id == drill_id)
        .all()
    )
    
    
def get_issues_by_user_id(user_id: UUID, session: Session) -> list[models.Issue]:
    return (session.query(models.Issue)
        .join(AnalysisIssue, models.Issue.id == AnalysisIssue.issue_id)
        .join(Analysis, AnalysisIssue.analysis_id == Analysis.id)
        .filter((Analysis.user_id == user_id) & (AnalysisIssue.active == True))
        .distinct()
        .all())


# ------------ CREATE ------------


def create_issue(issue: models.Issue, session: Session) -> models.Issue:
    session.add(issue)
    session.flush()
    return issue


# ------------ UPDATE ------------


def update_issue(issue: models.Issue, session: Session) -> models.Issue:
    session.add(issue)
    session.flush()
    return issue


# ------------ DELETE ------------


def delete_issue(issue: models.Issue, session: Session) -> None:
    session.delete(issue)
    session.flush()


def delete_issues(issues: list[models.Issue], session: Session) -> None:
    stmt = delete(models.Issue).where(models.Issue.id.in_([issue.id for issue in issues]))
    session.execute(stmt)
    session.flush()


# ------------ COUNT ------------


def get_issue_count(session: Session) -> int:
    """Get total count of issues."""
    stmt = select(func.count()).select_from(models.Issue)
    return session.scalar(stmt) or 0


def get_issues_with_no_drills_count(session: Session) -> int:
    """Get count of issues that have no drill mappings."""
    subquery = select(IssueDrill.issue_id).distinct()
    stmt = (
        select(func.count())
        .select_from(models.Issue)
        .where(models.Issue.id.notin_(subquery))
    )
    return session.scalar(stmt) or 0