from ..base import Base
import uuid
from sqlalchemy import (
    Text,
    DateTime,
    CheckConstraint,
    Index,
    ForeignKey,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, Mapped, mapped_column


class Program(Base):
    __tablename__ = "programs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
    )

    analysis_issue_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("analysis_issues.id", ondelete="CASCADE"),
    )

    # The issue this program grooves. Set for every program (AI, coach, or browse
    # seeded). analysis_issue_id above is kept only as AI provenance.
    issue_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("issues.id", ondelete="CASCADE"),
    )

    title: Mapped[str] = mapped_column(Text, nullable=False)

    status: Mapped[str] = mapped_column(
        Text,
        CheckConstraint("status IN ('active','completed','abandoned')"),
        nullable=False,
        server_default="active",
    )

    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # Relationships
    steps = relationship(
        "ProgramStep",
        back_populates="program",
        cascade="all, delete-orphan",
        order_by="ProgramStep.order_index",
    )

    drill_states = relationship(
        "ProgramDrillState",
        back_populates="program",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("idx_programs_user", "user_id"),
        Index("idx_programs_user_status", "user_id", "status"),
        Index("idx_programs_analysis_issue", "analysis_issue_id"),
        Index("idx_programs_issue_id", "issue_id"),
    )
