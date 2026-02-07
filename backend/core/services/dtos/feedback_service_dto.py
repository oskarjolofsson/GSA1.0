from uuid import UUID
from dataclasses import dataclass


@dataclass
class CreateFeedbackDTO:
    user_id: UUID
    rating: int
    comments: str


@dataclass
class FeedbackResponseDTO:
    id: UUID
    user_id: UUID
    rating: int
    comments: str
    created_at: str