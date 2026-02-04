from ..models.AnalysisDrill import AnalysisDrill
from sqlalchemy.orm import Session

# ------------ GET ------------


def get_analysis_drill_by_id(analysis_drill_id, session: Session) -> AnalysisDrill:
    return session.get(AnalysisDrill, analysis_drill_id)


# ------------ CREATE ------------


def create_analysis_drill(
    analysis_drill: AnalysisDrill, session: Session
) -> AnalysisDrill:
    session.add(analysis_drill)
    session.flush()
    return analysis_drill
