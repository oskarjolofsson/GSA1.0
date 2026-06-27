from ..base import Base
import uuid
from sqlalchemy import (
    Text,
    DateTime,
    Integer,
    CheckConstraint,
    Index,
    UniqueConstraint,
    ForeignKey,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, Mapped, mapped_column


class ProgramDrillState(Base):
    """Per-drill spaced-repetition state within a program. `strength` rises on a
    'dialed' block, holds on 'ok', falls on 'rough'. The scheduler fills each range
    session with the lowest-strength drills."""

    __tablename__ = "program_drill_states"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    program_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("programs.id", ondelete="CASCADE"),
        nullable=False,
    )

    drill_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("drills.id", ondelete="CASCADE"),
        nullable=False,
    )

    strength: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")

    last_seen_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True))

    times_seen: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")

    last_grade: Mapped[str | None] = mapped_column(
        Text,
        CheckConstraint("last_grade IN ('rough','ok','dialed')"),
    )

    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # Relationships
    program = relationship("Program", back_populates="drill_states")

    __table_args__ = (
        UniqueConstraint("program_id", "drill_id", name="uq_program_drill_state"),
        Index("idx_program_drill_states_program", "program_id"),
        Index("idx_program_drill_states_program_strength", "program_id", "strength"),
    )
