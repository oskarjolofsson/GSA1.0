from ..base import Base
import uuid
from sqlalchemy import (
    Text,
    DateTime,
    CheckConstraint,
    Index,
    Boolean,
    JSON,
    ForeignKey,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, Mapped, mapped_column

# Related models
from .Video import Video
from .AnalysisIssue import AnalysisIssue


class Analysis(Base):
    __tablename__ = "analysis"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
    )

    video_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("videos.id", ondelete="SET NULL"),
    )

    model_version: Mapped[str] = mapped_column(Text, nullable=False)

    status: Mapped[str] = mapped_column(
        Text,
        CheckConstraint(
            "status IN ('awaiting_upload','processing','completed','failed')"
        ),
        nullable=False,
        server_default="awaiting_upload",
    )

    success: Mapped[bool | None] = mapped_column(Boolean)

    raw_output_json: Mapped[dict | None] = mapped_column(JSON)

    error_message: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    started_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True))

    video = relationship("Video", back_populates="analyses")
    issues = relationship(
        "AnalysisIssue",
        back_populates="analysis",
        cascade="all, delete-orphan",
    )

    __table_args__ = (Index("idx_analysis_video_id", "video_id"),)
