from sqlalchemy import UUID

from ..models.AnalysisIssue import AnalysisIssue
from ..models.Analysis import Analysis
from sqlalchemy.orm import Session


def get_analysis_issue_by_id(analysis_issue_id, session: Session) -> AnalysisIssue:
    return session.get(AnalysisIssue, analysis_issue_id)
    
    
def create_analysis_issue(analysis_issue: AnalysisIssue, session: Session) -> AnalysisIssue:
    session.add(analysis_issue)
    session.flush()
    return analysis_issue


def modify_analysis_issue(analysis_issue: AnalysisIssue, session: Session) -> AnalysisIssue:
    merged = session.merge(analysis_issue)
    session.flush()
    return merged


def get_analysis_issue_by_user_id_and_issue_id(user_id, issue_id, session: Session) -> AnalysisIssue | None:
    return (
        session.query(AnalysisIssue)
        .join(Analysis, AnalysisIssue.analysis_id == Analysis.id)
        .filter(Analysis.user_id == user_id, AnalysisIssue.issue_id == issue_id, AnalysisIssue.active == True)
        .first()
    )
    

def get_analysis_issues_by_issue_ids(issue_ids: list[UUID], session: Session) -> list[AnalysisIssue]:
    return session.query(AnalysisIssue).filter(AnalysisIssue.issue_id.in_(issue_ids), AnalysisIssue.active == True).all()


def get_analysis_issues_by_analysis_id(analysis_id, session: Session) -> list[AnalysisIssue]:
    return session.query(AnalysisIssue).filter(AnalysisIssue.analysis_id == analysis_id, AnalysisIssue.active == True).all()


def delete_analysis_issue(analysis_issue: AnalysisIssue, session: Session) -> None:
    session.delete(analysis_issue)
    session.flush()