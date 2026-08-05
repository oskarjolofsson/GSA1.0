from ..base import Base
import uuid
from sqlalchemy import (
    Text,
    DateTime,
    CheckConstraint,
    ForeignKey,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, Mapped, mapped_column


class PracticeSession(Base):
    __tablename__ = "practice_sessions"

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

    started_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    completed_at: Mapped[DateTime | None] = mapped_column(
        DateTime(timezone=True),
    )

    status: Mapped[str] = mapped_column(
        Text,
        CheckConstraint(
            "status IN ('in_progress','completed','abandoned')"
        ),
        nullable=False,
        server_default="in_progress",
    )

    # Program linkage (nullable: ad-hoc practice outside a program is still allowed).
    session_type: Mapped[str | None] = mapped_column(
        Text,
        # 'retest' is a frozen legacy value: historical sessions carry it, nothing
        # writes it any more. It stays legal so those rows keep validating.
        CheckConstraint("session_type IN ('range','play','retest')"),
    )

    program_step_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("program_steps.id", ondelete="SET NULL"),
    )

    # Which part of the game this session was, stamped from the practised issue at start.
    #
    # Stored rather than joined because there is nothing to join through: program_step_id
    # above is never written by any code, and analysis_issue_id is NULL for every session
    # started from the library. It is also a fact about a day that already happened, so it
    # must not move when an admin re-files the issue.
    #
    # NULL = unattributed: free practice with no issue, and anything from a build older
    # than this column. The graph shows those; it never drops them.
    area: Mapped[str | None] = mapped_column(
        Text,
        ForeignKey("taxonomy_areas.key", ondelete="RESTRICT"),
    )

    # Free-text notes (e.g. how an on-course round went).
    notes: Mapped[str | None] = mapped_column(Text)

    # Relationships
    drill_runs = relationship(
        "PracticeDrillRun",
        back_populates="session",
        cascade="all, delete-orphan",
    )
