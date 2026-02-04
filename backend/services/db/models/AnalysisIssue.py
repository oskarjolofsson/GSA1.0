from ..base import Base
import uuid
from sqlalchemy import (
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

# Related models
from .AnalysisDrill import AnalysisDrill


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

    issue_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("issues.id", ondelete="CASCADE"),
        nullable=False,
    )

    impact_rank: Mapped[int] = mapped_column(
        Integer,
        CheckConstraint("impact_rank >= 1"),
        nullable=False,
    )

    confidence: Mapped[float | None] = mapped_column(
        CheckConstraint("confidence >= 0.0 AND confidence <= 1.0")
    )

    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    analysis = relationship("Analysis", back_populates="issues")
    issue = relationship("Issue", back_populates="analysis_issues")
    drills = relationship(
        "AnalysisDrill",
        back_populates="issue",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        UniqueConstraint("analysis_id", "impact_rank"),
        Index("idx_analysis_issues_issue_id", "issue_id"),
        Index("idx_analysis_issues_confidence", "confidence"),
        Index("idx_analysis_issues_created_at", "created_at"),
    )
