from ..base import Base
import uuid
from sqlalchemy import (
    Text,
    DateTime,
    Interval,
    CheckConstraint,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import timedelta


class Video(Base):
    __tablename__ = "videos"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
    )

    video_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    thumbnail_key: Mapped[str | None] = mapped_column(Text, nullable=True)

    start_time: Mapped[timedelta | None] = mapped_column(Interval, nullable=True)
    end_time: Mapped[timedelta | None] = mapped_column(Interval, nullable=True)

    camera_view: Mapped[str | None] = mapped_column(
        Text,
        CheckConstraint("camera_view IN ('unknown', 'face_on', 'down_the_line')"),
        nullable=True,
    )

    club_type: Mapped[str | None] = mapped_column(
        Text,
        CheckConstraint("club_type IN ('unknown', 'wedge', 'iron', 'wood', 'driver')"),
        nullable=True,
    )

    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    analyses = relationship(
        "Analysis",
        back_populates="video",
        passive_deletes=True,
    )

    __table_args__ = (Index("idx_videos_user_id", "user_id"),)
    
    
# Mandatory when creating new Video instances: user_id, video_key
