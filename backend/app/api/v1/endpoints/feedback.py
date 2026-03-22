from fastapi import APIRouter, Depends, Query
from uuid import UUID
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.require_admin import require_admin
from sqlalchemy.orm import Session

from app.api.v1.schemas.feedback import (
    CreateFeedbackRequest,
    CreateFeedbackResponse,
    GetFeedback,
)
from core.services.feedback_service import (
    create_feedback as service_create_feedback,
    get_all_feedback as service_get_all_feedback,
)
from core.services.dtos.feedback_service_dto import CreateFeedbackDTO

router = APIRouter()


@router.post("/", response_model=CreateFeedbackResponse, status_code=201)
def create_feedback(
    request: CreateFeedbackRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new feedback entry.

    Arguments (JSON body):
        rating (int): Rating value (e.g., 1-5)
        comments (str): Additional comments from the user
    """
    user_id = UUID(current_user["user_id"])
    
    dto = CreateFeedbackDTO(
        user_id=user_id,
        rating=request.rating,
        comments=request.comments,
    )

    result = service_create_feedback(dto=dto, db_session=db)

    return CreateFeedbackResponse(
        success=True,
        feedback_id=result.id,
    )


@router.get("/", response_model=list[GetFeedback])
def get_all_feedback(
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Get all feedback entries.

    Arguments:
        limit (int): Maximum number of feedback entries to return (default: 100, max: 1000)

    Returns:
        JSON response with a list of all feedback entries
    """
    feedbacks = service_get_all_feedback(db_session=db, limit=limit)

    return [GetFeedback.from_domain(feedback) for feedback in feedbacks]