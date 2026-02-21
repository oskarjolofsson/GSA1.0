import uuid
from ..base import Base
from sqlalchemy import (
    CheckConstraint,
    Text,
    Integer,
    DateTime,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column


class UserFeedback(Base):
    __tablename__ = "user_feedback"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
    )
    
    rating: Mapped[int] = mapped_column(
        Integer,
        CheckConstraint("rating >= 1 AND rating <= 3"),
        nullable=False,
        
    )
    
    comments: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )