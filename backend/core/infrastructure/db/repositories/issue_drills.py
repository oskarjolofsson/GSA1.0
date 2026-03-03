from ..models.IssueDrill import IssueDrill
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from uuid import UUID


def get_issue_drill_by_id(issue_drill_id: UUID, session: Session) -> IssueDrill:
    return session.get(IssueDrill, issue_drill_id)


def get_issue_drills_by_issue_id(issue_id: UUID, session: Session) -> list[IssueDrill]:
    return session.query(IssueDrill).filter(IssueDrill.issue_id == issue_id).all()


def get_issue_drills_by_drill_id(drill_id: UUID, session: Session) -> list[IssueDrill]:
    return session.query(IssueDrill).filter(IssueDrill.drill_id == drill_id).all()


def create_issue_drill(issue_drill: IssueDrill, session: Session) -> IssueDrill:
    session.add(issue_drill)
    session.flush()
    return issue_drill


def delete_issue_drill(issue_drill_id: UUID, session: Session) -> None:
    issue_drill = session.get(IssueDrill, issue_drill_id)
    if issue_drill:
        session.delete(issue_drill)
        session.flush()


# ------------ COUNT ------------


def get_mapping_count(session: Session) -> int:
    """Get total count of issue-drill mappings."""
    stmt = select(func.count()).select_from(IssueDrill)
    return session.scalar(stmt) or 0
