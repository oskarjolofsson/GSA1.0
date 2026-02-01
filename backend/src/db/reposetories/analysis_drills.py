from ..models.AnalysisDrill import AnalysisDrill
from ..session import SessionLocal
from sqlalchemy import select

def get_analysis_drill_by_id(analysis_drill_id) -> AnalysisDrill:
    with SessionLocal() as session:
        return session.get(AnalysisDrill, analysis_drill_id)
    
    
def create_analysis_drill(analysis_drill: AnalysisDrill) -> AnalysisDrill:
    with SessionLocal() as session:
        try:
            session.add(analysis_drill)
            session.commit()
            session.refresh(analysis_drill)
            return analysis_drill
        except Exception:
            session.rollback()
            raise