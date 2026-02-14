from fastapi import APIRouter, Depends, HTTPException, Query
from uuid import UUID
from app.dependencies.db import get_db
from sqlalchemy.orm import Session

from app.api.v1.schemas.feedback import (
    CreateFeedbackRequest,
    CreateFeedbackResponse,
    GetFeedback,
)
from core.services.feedback_service import (
    create_feedback as service_create_feedback,
    get_feedback_by_id as service_get_feedback_by_id,
    get_feedback_by_user_id as service_get_feedback_by_user_id,
    get_all_feedback as service_get_all_feedback,
    get_feedback_by_rating as service_get_feedback_by_rating,
)
from core.services.dtos.feedback_service_dto import CreateFeedbackDTO

router = APIRouter()


@router.post("/", response_model=CreateFeedbackResponse, status_code=201)
def create_feedback(
    request: CreateFeedbackRequest,
    db: Session = Depends(get_db)
):
    """
    Create a new feedback entry.

    Arguments (JSON body):
        user_id (UUID): User identifier
        rating (int): Rating value (e.g., 1-5)
        comments (str): Additional comments from the user
    """
    dto = CreateFeedbackDTO(
        user_id=request.user_id,
        rating=request.rating,
        comments=request.comments,
    )

    result = service_create_feedback(dto=dto, db_session=db)

    return CreateFeedbackResponse(
        success=True,
        feedback_id=result.id,
    )


@router.get("/{feedback_id}", response_model=GetFeedback)
def get_feedback(feedback_id: UUID, db: Session = Depends(get_db)):
    """
    Get details of a specific feedback entry.

    Arguments:
        feedback_id (UUID): Feedback identifier

    Returns:
        JSON response with feedback details
    """
    feedback = service_get_feedback_by_id(feedback_id, db_session=db)
    
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")

    return GetFeedback.from_domain(feedback)


@router.get("/by-user/{user_id}", response_model=list[GetFeedback])
def get_feedback_by_user(user_id: UUID, db: Session = Depends(get_db)):
    """
    Get all feedback entries for a specific user.

    Arguments:
        user_id (UUID): User identifier
        
    Returns:
        JSON response with a list of feedback entries
    """
    feedbacks = service_get_feedback_by_user_id(user_id, db_session=db)

    return [GetFeedback.from_domain(feedback) for feedback in feedbacks]

    
@router.get("/by-rating/{rating}", response_model=list[GetFeedback])
def get_feedback_by_rating(rating: int, db: Session = Depends(get_db)):
    """
    Get all feedback entries with a specific rating.

    Arguments:
        rating (int): Rating value to filter by

    Returns:
        JSON response with a list of feedback entries
    """
    feedbacks = service_get_feedback_by_rating(rating, db_session=db)

    return [GetFeedback.from_domain(feedback) for feedback in feedbacks]


@router.get("/", response_model=list[GetFeedback])
def get_all_feedback(
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db)
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