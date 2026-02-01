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

    video_key: Mapped[str] = mapped_column(Text, nullable=False)

    start_time: Mapped = mapped_column(Interval)
    end_time: Mapped = mapped_column(Interval)

    camera_view: Mapped[str] = mapped_column(
        Text,
        CheckConstraint("camera_view IN ('unknown', 'face_on', 'down_the_line')"),
    )

    club_type: Mapped[str] = mapped_column(
        Text,
        CheckConstraint("club_type IN ('unknown', 'iron', 'driver')"),
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
