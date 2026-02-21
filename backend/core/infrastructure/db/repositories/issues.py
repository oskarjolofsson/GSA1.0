from ..models.Issue import Issue
from ..models.AnalysisIssue import AnalysisIssue
from ..models.IssueDrill import IssueDrill
from ..models.Analysis import Analysis
from sqlalchemy.orm import Session
from uuid import UUID

# ------------ GET ------------


def get_issue_by_id(issue_id, session: Session) -> Issue:
    return session.get(Issue, issue_id)


def get_all_issues(session: Session) -> list[Issue]:
    return session.query(Issue).all()


def get_issues_by_analysis_id(analysis_id: UUID, session: Session) -> list[Issue]:
    """Get all issues associated with a specific analysis through the analysis_issues junction table."""
    return (
        session.query(Issue)
        .join(AnalysisIssue, Issue.id == AnalysisIssue.issue_id)
        .filter(AnalysisIssue.analysis_id == analysis_id)
        .all()
    )


def get_issues_by_drill_id(drill_id: UUID, session: Session) -> list[Issue]:
    """Get all issues associated with a specific drill through the issue_drill junction table."""
    return (
        session.query(Issue)
        .join(IssueDrill, Issue.id == IssueDrill.issue_id)
        .filter(IssueDrill.drill_id == drill_id)
        .all()
    )
    
    
def get_issues_by_user_id(user_id: UUID, session: Session) -> list[Issue]:
    return (session.query(Issue)
        .join(AnalysisIssue, Issue.id == AnalysisIssue.issue_id)
        .join(Analysis, AnalysisIssue.analysis_id == Analysis.id)
        .filter(Analysis.user_id == user_id)
        .distinct()
        .all())


# ------------ CREATE ------------


def create_issue(issue: Issue, session: Session) -> Issue:
    session.add(issue)
    session.flush()
    return issue


# ------------ UPDATE ------------


def update_issue(issue: Issue, session: Session) -> Issue:
    session.add(issue)
    session.flush()
    return issue


# ------------ DELETE ------------


def delete_issue(issue: Issue, session: Session) -> None:
    session.delete(issue)
    session.flush()
