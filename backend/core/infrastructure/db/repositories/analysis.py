from sqlalchemy import select, text, func
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime, date
from ..models.Analysis import Analysis


def get_activity_counts_by_day(
    user_id: UUID,
    tz: str,
    session: Session,
    start_utc: datetime | None = None,
    end_utc: datetime | None = None,
) -> list[tuple[date, int]]:
    """
    Count completed successful analyses per calendar day for a user, grouping by
    the calendar day of `created_at` interpreted in the given IANA timezone.

    No area grouping: an analysis is a filmed swing, so the caller attributes all of
    them to one area rather than this query knowing which.

    `start_utc`/`end_utc` bound the scan as a half-open range, sargable against
    (user_id, created_at).
    """
    local_day = func.date(func.timezone(tz, Analysis.created_at))
    stmt = (
        select(local_day.label("occurred_on"), func.count().label("count"))
        .where(Analysis.user_id == user_id)
        .where(Analysis.status == "completed")
        .where(Analysis.success == True)
        .group_by(local_day)
    )
    if start_utc is not None:
        stmt = stmt.where(Analysis.created_at >= start_utc)
    if end_utc is not None:
        stmt = stmt.where(Analysis.created_at < end_utc)
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

def add_analysis(fields: dict, session: Session) -> Analysis:
    """Insert an analysis from already-resolved fields."""
    return create_analysis(Analysis(**fields), session)


def commit_failed_state(analysis: Analysis, message: str, session: Session) -> None:
    """Record why an analysis failed, and commit it immediately.

    The one place in the codebase that commits outside `get_db`. It has to: the caller
    re-raises straight after, so the request's own commit never happens and the failure
    would roll back with everything else — leaving an analysis stuck in `processing`
    with nothing saying why.
    """
    analysis.error_message = message
    analysis.success = False
    analysis.status = "failed"
    session.add(analysis)
    session.commit()
