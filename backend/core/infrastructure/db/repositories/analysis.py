from sqlalchemy import select, text, func
from sqlalchemy.orm import Session
from uuid import UUID
from ..models.Analysis import Analysis


def get_analysis_by_id(analysis_id: str, session: Session) -> Analysis:
    return session.get(Analysis, analysis_id)


def get_analysis_count_by_user_id(user_id: UUID, session: Session) -> int:
    """Get the count of completed successful analyses for a user."""
    stmt = (
        select(func.count())
        .select_from(Analysis)
        .where(Analysis.user_id == user_id)
        .where(Analysis.status == "completed")
        .where(Analysis.success == True)
    )
    return session.scalar(stmt) or 0


def get_analysis_counts_by_user_ids(user_ids: list[UUID], session: Session) -> dict[UUID, int]:
    """
    Get the count of completed successful analyses for multiple users in a single query.
    Returns a dict mapping user_id to count.
    """
    if not user_ids:
        return {}
    
    stmt = (
        select(Analysis.user_id, func.count())
        .where(Analysis.user_id.in_(user_ids))
        .where(Analysis.status == "completed")
        .where(Analysis.success == True)
        .group_by(Analysis.user_id)
    )
    
    results = session.execute(stmt).all()
    return {user_id: count for user_id, count in results}
    
    
def get_analyses_by_user_id(user_id: str, session: Session) -> list[Analysis]:
    stmt = (
        select(Analysis)
        .where(Analysis.user_id == user_id)
        .where(Analysis.status == "completed")
        .where(Analysis.success == True)
        .order_by(Analysis.created_at.desc(), Analysis.id.desc())
    )
        
    return session.scalars(stmt).all()
    

def create_analysis(analysis: Analysis, session: Session) -> Analysis:
    session.add(analysis)
    session.flush()
    return analysis


def update_analysis(analysis: Analysis, session: Session) -> Analysis:
    merged = session.merge(analysis)
    session.flush()
    return merged


def delete_analysis(analysis: Analysis, session: Session) -> None:
    session.delete(analysis)
    session.flush()