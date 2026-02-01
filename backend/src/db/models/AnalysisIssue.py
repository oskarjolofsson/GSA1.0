from ..base import Base
import uuid
from sqlalchemy import (
    Text,
    DateTime,
    CheckConstraint,
    Index,
    UniqueConstraint,
    Integer,
    ForeignKey,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, Mapped, mapped_column


class AnalysisIssue(Base):
    __tablename__ = "analysis_issues"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    analysis_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("analysis.id", ondelete="CASCADE"),
        nullable=False,
    )

    issue_code: Mapped[str] = mapped_column(Text, nullable=False)

    phase: Mapped[str | None] = mapped_column(
        Text,
        CheckConstraint(
            "phase IN ('SETUP','BACKSWING','TRANSITION','DOWNSWING','IMPACT','FOLLOW_THROUGH')"
        ),
    )

    impact_rank: Mapped[int] = mapped_column(
        Integer,
        CheckConstraint("impact_rank >= 1"),
        nullable=False,
    )

    severity: Mapped[str | None] = mapped_column(
        Text,
        CheckConstraint("severity IN ('MINOR','MODERATE','MAJOR')"),
    )

    confidence: Mapped[float | None] = mapped_column(
        CheckConstraint("confidence >= 0.0 AND confidence <= 1.0")
    )

    current_motion: Mapped[str | None] = mapped_column(Text)
    expected_motion: Mapped[str | None] = mapped_column(Text)
    swing_effect: Mapped[str | None] = mapped_column(Text)
    shot_outcome: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    analysis = relationship("Analysis", back_populates="issues")
    drills = relationship(
        "AnalysisDrill",
        back_populates="issue",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        UniqueConstraint("analysis_id", "impact_rank"),
        Index("idx_analysis_issues_issue_code", "issue_code"),
        Index("idx_analysis_issues_confidence", "confidence"),
        Index("idx_analysis_issues_created_at", "created_at"),
    )
