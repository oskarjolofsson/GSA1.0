from ..base import Base
import uuid
from sqlalchemy import (
    Text,
    DateTime,
    CheckConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, Mapped, mapped_column
from .IssueDrill import IssueDrill


class Issue(Base):
    __tablename__ = "issues"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    title: Mapped[str] = mapped_column(Text, nullable=False)

    phase: Mapped[str | None] = mapped_column(
        Text,
        CheckConstraint(
            "phase IN ('SETUP','BACKSWING','TRANSITION','DOWNSWING','IMPACT','FOLLOW_THROUGH')"
        ),
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

    # Relationship to analysis_issues
    analysis_issues = relationship(
        "AnalysisIssue",
        back_populates="issue",
        cascade="all, delete-orphan",
    )

    # Relationship to issue_drill
    issue_drills = relationship(
        "IssueDrill",
        back_populates="issue",
        cascade="all, delete-orphan",
    )
