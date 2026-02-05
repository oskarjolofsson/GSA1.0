from ..models.Drill import Drill
from sqlalchemy.orm import Session

# ------------ GET ------------


def get_drill_by_id(drill_id, session: Session) -> Drill:
    return session.get(Drill, drill_id)


# ------------ CREATE ------------


def create_drill(drill: Drill, session: Session) -> Drill:
    session.add(drill)
    session.flush()
    return drill


# ------------ UPDATE ------------


def update_drill(drill: Drill, session: Session) -> Drill:
    session.add(drill)
    session.flush()
    return drill