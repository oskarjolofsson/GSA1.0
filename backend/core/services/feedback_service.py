from sqlalchemy.orm import Session
from uuid import UUID

from core.infrastructure.db.repositories.feedback import (
    get_feedback_by_id as repo_get_feedback_by_id,
    get_feedback_by_user_id as repo_get_feedback_by_user_id,
    get_all_feedback as repo_get_all_feedback,
    create_feedback as repo_create_feedback,
    get_feedback_by_rating as repo_get_feedback_by_rating,
)
from core.infrastructure.db.models.Feedback import UserFeedback
from .dtos.feedback_service_dto import CreateFeedbackDTO, FeedbackResponseDTO
from core.infrastructure.db.session import SessionLocal


def create_feedback(dto: CreateFeedbackDTO, db_session: Session) -> FeedbackResponseDTO:
    """Create a new feedback entry."""
    new_feedback = UserFeedback(
        user_id=dto.user_id,
        rating=dto.rating,
        comments=dto.comments,
    )

    created_feedback = repo_create_feedback(new_feedback, db_session)

    return from_feedback_to_response_dto(created_feedback)


def get_feedback_by_id(feedback_id: UUID, db_session: Session) -> FeedbackResponseDTO | None:
    """Get a feedback entry by its ID."""
    feedback = repo_get_feedback_by_id(str(feedback_id), db_session)

    if not feedback:
        return None

    return from_feedback_to_response_dto(feedback)


def get_feedback_by_user_id(user_id: UUID, db_session: Session) -> list[FeedbackResponseDTO]:
    """Get all feedback entries for a specific user."""
    feedbacks = repo_get_feedback_by_user_id(str(user_id), db_session)

    return [from_feedback_to_response_dto(feedback) for feedback in feedbacks]


def get_all_feedback(db_session: Session, limit: int = 100) -> list[FeedbackResponseDTO]:
    """Get all feedback entries."""
    feedbacks = repo_get_all_feedback(db_session, limit)

    return [from_feedback_to_response_dto(feedback) for feedback in feedbacks]


def get_feedback_by_rating(rating: int, db_session: Session) -> list[FeedbackResponseDTO]:
    """Get all feedback entries with a specific rating."""
    feedbacks = repo_get_feedback_by_rating(rating, db_session)

    return [from_feedback_to_response_dto(feedback) for feedback in feedbacks]


# ------------ Helper Methods ------------


def from_feedback_to_response_dto(feedback: UserFeedback) -> FeedbackResponseDTO:
    """Transform a UserFeedback object to FeedbackResponseDTO."""
    return FeedbackResponseDTO(
        id=feedback.id,
        user_id=feedback.user_id,
        rating=feedback.rating,
        comments=feedback.comments,
        created_at=feedback.created_at.isoformat() if feedback.created_at else None,
    )