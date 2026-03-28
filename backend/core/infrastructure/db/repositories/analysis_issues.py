from sqlalchemy import UUID

from core.infrastructure.db import models
from sqlalchemy.orm import Session


def get_analysis_issue_by_id(analysis_issue_id, session: Session) -> models.AnalysisIssue:
    return session.get(models.AnalysisIssue, analysis_issue_id)
    
    
def create_analysis_issue(analysis_issue: models.AnalysisIssue, session: Session) -> models.AnalysisIssue:
    session.add(analysis_issue)
    session.flush()
    return analysis_issue


def modify_analysis_issues(analysis_issues: list[models.AnalysisIssue], session: Session) -> list[models.AnalysisIssue]:
    merged = [session.merge(ai) for ai in analysis_issues]
    session.flush()
    return merged
    


def get_analysis_issues_by_user_id_and_issue_id(user_id, issue_id, session: Session) -> list[models.AnalysisIssue] | None:
    return (
        session.query(models.AnalysisIssue)
        .join(models.Analysis, models.AnalysisIssue.analysis_id == models.Analysis.id)
        .filter(models.Analysis.user_id == user_id, models.AnalysisIssue.issue_id == issue_id, models.AnalysisIssue.active == True)
        .all()
    )
    
    
def get_analysis_issues_by_user_id_and_issue_ids(user_id: UUID, issue_ids: list[UUID], session: Session) -> list[models.AnalysisIssue] | None:
    return (
        session.query(models.AnalysisIssue)
        .join(models.Analysis, models.AnalysisIssue.analysis_id == models.Analysis.id)
        .filter(
            models.Analysis.user_id == user_id, 
            models.AnalysisIssue.issue_id.in_(issue_ids),  # Ändrat här
            models.AnalysisIssue.active == True
        )
        .all()
    )
    

def get_analysis_issues_by_analysis_id(analysis_id, session: Session) -> list[models.AnalysisIssue]:
    return session.query(models.AnalysisIssue).filter(models.AnalysisIssue.analysis_id == analysis_id, models.AnalysisIssue.active == True).all()


def delete_analysis_issue(analysis_issue: models.AnalysisIssue, session: Session) -> None:
    session.delete(analysis_issue)
    session.flush()