from sqlalchemy import select, text
from ..session import SessionLocal
from ..models.Analysis import Analysis


def get_analysis_by_id(analysis_id) -> Analysis:
    with SessionLocal() as session:
        return session.get(Analysis, analysis_id)
    
    
def get_analyses_by_user_id(user_id) -> list[Analysis]:
    with SessionLocal() as session:
        stmt = (
            select(Analysis)
            .where(Analysis.user_id == user_id)
            .where(Analysis.status == text("'completed'"))
            .where(Analysis.success == True)
            .order_by(Analysis.created_at.desc())
        )
        
        return session.scalars(stmt).all()
    

def create_analysis(analysis: Analysis) -> Analysis:
    with SessionLocal() as session:
        try:
            session.add(analysis)
            session.commit()
            session.refresh(analysis)
            return analysis
        except Exception:
            session.rollback()
            raise


def update_analysis(analysis: Analysis) -> Analysis:
    with SessionLocal() as session:
        try:
            session.merge(analysis)
            session.commit()
            session.refresh(analysis)
            return analysis
        except Exception:
            session.rollback()
            raise