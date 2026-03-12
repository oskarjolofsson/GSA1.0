from ..base import Base
import uuid
from sqlalchemy import (
    DateTime,
    Integer,
    Boolean,
    ForeignKey,
    Index,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, Mapped, mapped_column


class PracticeRep(Base):
    __tablename__ = "practice_reps"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    drill_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("practice_drill_runs.id", ondelete="CASCADE"),
        nullable=False,
    )

    rep_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    success: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
    )

    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # Relationships
    drill_run = relationship("PracticeDrillRun", back_populates="reps")

    __table_args__ = (
        UniqueConstraint("drill_run_id", "rep_number", name="idx_practice_reps_unique_rep"),
        Index("idx_practice_reps_drill_run", "drill_run_id"),
    )
