from sqlalchemy import text
from ..session import SessionLocal
from ..models.Analysis import Analysis


def get_analysis_by_id(analysis_id):
    with SessionLocal() as session:
        return session.get(Analysis, analysis_id)