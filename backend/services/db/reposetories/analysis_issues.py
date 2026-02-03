from ..models.AnalysisIssue import AnalysisIssue
from ..session import SessionLocal
from sqlalchemy import select


def get_analysis_issue_by_id(analysis_issue_id) -> AnalysisIssue:
    with SessionLocal() as session:
        return session.get(AnalysisIssue, analysis_issue_id)
    
    
def create_analysis_issue(analysis_issue: AnalysisIssue) -> AnalysisIssue:
    with SessionLocal() as session:
        try:
            session.add(analysis_issue)
            session.commit()
            session.refresh(analysis_issue)
            return analysis_issue
        except Exception:
            session.rollback()
            raise