from sqlalchemy import select
from sqlalchemy.orm import Session
from ..models.Feedback import UserFeedback


def get_feedback_by_id(feedback_id: str, session: Session) -> UserFeedback:
    """Get a single feedback entry by ID."""
    return session.get(UserFeedback, feedback_id)


def get_feedback_by_user_id(user_id: str, session: Session) -> list[UserFeedback]:
    """Get all feedback entries for a specific user, ordered by most recent first."""
    stmt = (
        select(UserFeedback)
        .where(UserFeedback.user_id == user_id)
        .order_by(UserFeedback.created_at.desc())
    )
    return session.scalars(stmt).all()


def get_all_feedback(session: Session, limit: int = 100) -> list[UserFeedback]:
    """Get all feedback entries, ordered by most recent first."""
    stmt = (
        select(UserFeedback)
        .order_by(UserFeedback.created_at.desc())
        .limit(limit)
    )
    return session.scalars(stmt).all()


def create_feedback(feedback: UserFeedback, session: Session) -> UserFeedback:
    """Create a new feedback entry."""
    session.add(feedback)
    session.flush()
    return feedback


def get_feedback_by_rating(rating: int, session: Session) -> list[UserFeedback]:
    """Get all feedback entries with a specific rating."""
    stmt = (
        select(UserFeedback)
        .where(UserFeedback.rating == rating)
        .order_by(UserFeedback.created_at.desc())
    )
    return session.scalars(stmt).all()
