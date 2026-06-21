from sqlalchemy import select, text, func
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime, date
from ..models.Analysis import Analysis


def get_activity_counts_by_day(
    user_id: UUID, tz: str, session: Session
) -> list[tuple[date, int]]:
    """
    Count completed successful analyses per calendar day for a user, grouping by
    the calendar day of `created_at` interpreted in the given IANA timezone.
    """
    local_day = func.date(func.timezone(tz, Analysis.created_at))
    stmt = (
        select(local_day.label("occurred_on"), func.count().label("count"))
        .where(Analysis.user_id == user_id)
        .where(Analysis.status == "completed")
        .where(Analysis.success == True)
        .group_by(local_day)
    )
    return [(row.occurred_on, row.count) for row in session.execute(stmt).all()]


def get_completed_analyses_in_range(
    user_id: UUID, start_utc: datetime, end_utc: datetime, session: Session
) -> list[Analysis]:
    """
    Fetch a user's completed successful analyses whose `created_at` falls in the
    half-open UTC range [start_utc, end_utc). Sargable against
    (user_id, created_at).
    """
    stmt = (
        select(Analysis)
        .where(Analysis.user_id == user_id)
        .where(Analysis.status == "completed")
        .where(Analysis.success == True)
        .where(Analysis.created_at >= start_utc)
        .where(Analysis.created_at < end_utc)
        .order_by(Analysis.created_at.desc())
    )
    return session.scalars(stmt).all()


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