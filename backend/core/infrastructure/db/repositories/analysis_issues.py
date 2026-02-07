from ..models.AnalysisIssue import AnalysisIssue
from sqlalchemy.orm import Session


def get_analysis_issue_by_id(analysis_issue_id, session: Session) -> AnalysisIssue:
    return session.get(AnalysisIssue, analysis_issue_id)
    
    
def create_analysis_issue(analysis_issue: AnalysisIssue, session: Session) -> AnalysisIssue:
    session.add(analysis_issue)
    session.flush()
    return analysis_issue


def get_analysis_issues_by_analysis_id(analysis_id, session: Session):
    return session.query(AnalysisIssue).filter(AnalysisIssue.analysis_id == analysis_id).all()


def delete_analysis_issue(analysis_issue: AnalysisIssue, session: Session) -> None:
    session.delete(analysis_issue)
    session.flush()