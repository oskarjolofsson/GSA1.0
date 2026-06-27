from ..base import Base
import uuid
from sqlalchemy import (
    Text,
    DateTime,
    Integer,
    CheckConstraint,
    Index,
    ForeignKey,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, Mapped, mapped_column


class ProgramStep(Base):
    __tablename__ = "program_steps"

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

    order_index: Mapped[int] = mapped_column(Integer, nullable=False)

    session_type: Mapped[str] = mapped_column(
        Text,
        CheckConstraint("session_type IN ('range','play','retest')"),
        nullable=False,
    )

    # Shape of `prescription` by session_type:
    #   range:  {"drill_ids": [...], "num_blocks": int, "cue": str | null}
    #   play:   {"holes": int, "focus": str}
    #   retest: {"instruction": str}
    prescription: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
    )

    status: Mapped[str] = mapped_column(
        Text,
        CheckConstraint("status IN ('pending','completed','skipped')"),
        nullable=False,
        server_default="pending",
    )

    practice_session_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("practice_sessions.id", ondelete="SET NULL"),
    )

    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # Relationships
    program = relationship("Program", back_populates="steps")

    __table_args__ = (
        Index("idx_program_steps_program", "program_id"),
        Index("idx_program_steps_program_order", "program_id", "order_index"),
    )
