from ..base import Base
import uuid
from sqlalchemy import (
    DateTime,
    Integer,
    Boolean,
    ForeignKey,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, Mapped, mapped_column


class PracticeDrillRun(Base):
    __tablename__ = "practice_drill_runs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("practice_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )

    drill_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("drills.id", ondelete="CASCADE"),
        nullable=False,
    )

    started_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    completed_at: Mapped[DateTime | None] = mapped_column(
        DateTime(timezone=True),
    )

    successful_reps: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default="0",
    )

    failed_reps: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default="0",
    )

    skipped: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default="false",
    )

    order_index: Mapped[int | None] = mapped_column(Integer)

    # Relationships
    session = relationship("PracticeSession", back_populates="drill_runs")
    reps = relationship(
        "PracticeRep",
        back_populates="drill_run",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("idx_practice_drill_runs_session", "session_id"),
        Index("idx_practice_drill_runs_session_order", "session_id", "order_index"),
        Index("idx_practice_drill_runs_drill", "drill_id"),
    )
