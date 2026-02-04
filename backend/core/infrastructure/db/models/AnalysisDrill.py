from ..base import Base
import uuid
from sqlalchemy import (
    DateTime,
    ForeignKey,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, Mapped, mapped_column


class AnalysisDrill(Base):
    __tablename__ = "analysis_drills"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    analysis_issue_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("analysis_issues.id", ondelete="CASCADE"),
        nullable=False,
    )

    drill_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("drills.id", ondelete="CASCADE"),
        nullable=False,
    )

    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    issue = relationship("AnalysisIssue", back_populates="drills")
    drill = relationship("Drill", back_populates="analysis_drills")
