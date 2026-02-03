from sqlalchemy import select, text
from sqlalchemy.orm import Session
from ..models.Analysis import Analysis


def get_analysis_by_id(analysis_id: str, session: Session) -> Analysis:
    return session.get(Analysis, analysis_id)
    
    
def get_analyses_by_user_id(user_id: str, session: Session) -> list[Analysis]:
    stmt = (
        select(Analysis)
        .where(Analysis.user_id == user_id)
        .where(Analysis.status == text("'completed'"))
            .where(Analysis.success == True)
            .order_by(Analysis.created_at.desc())
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
