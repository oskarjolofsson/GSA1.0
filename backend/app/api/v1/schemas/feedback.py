from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime


class CreateFeedbackRequest(BaseModel):
    user_id: UUID
    rating: int
    comments: str


class CreateFeedbackResponse(BaseModel):
    success: bool
    feedback_id: UUID


class GetFeedback(BaseModel):
    id: UUID
    user_id: UUID
    rating: int
    comments: str
    created_at: str

    model_config = ConfigDict(from_attributes=True)
    
    @classmethod
    def from_domain(cls, dto) -> "GetFeedback":
        """Convert FeedbackResponseDTO to GetFeedback schema."""
        return cls(
            id=dto.id,
            user_id=dto.user_id,
            rating=dto.rating,
            comments=dto.comments,
            created_at=dto.created_at,
        )
