from ..base import Base
import uuid
from sqlalchemy import (
    DateTime,
    Integer,
    Boolean,
    ForeignKey,
    Index,
    Numeric,
    SmallInteger,
    Text,
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

    # Nullable so the FK's SET NULL can actually fire. It was declared NOT NULL against
    # ondelete="SET NULL", which meant deleting a practised drill raised a not-null
    # violation instead. A run outlives its drill: the session still counts toward the
    # streak and the graph, it just loses its title.
    drill_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("drills.id", ondelete="SET NULL"),
    )

    started_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    completed_at: Mapped[DateTime | None] = mapped_column(
        DateTime(timezone=True),
    )

    # FROZEN. Carried the block-feel ordinal before `feel` existed, and is named for
    # something it has not meant in a long time. It stays because five API schemas expose
    # it and old builds read it; nothing new should write to it.
    successful_reps: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default="0",
    )

    # What the golfer scored, raw and in the metric's own units: 8 putts made, 4.2 feet
    # average. Ungraded on purpose -- the grade comes from the drill's current thresholds,
    # so it is derived, never stored.
    metric_value: Mapped[float | None] = mapped_column(Numeric)

    # Which metric produced that number, denormalised from drills.metric->>'type'. A drill
    # retuned from make_rate to proximity would otherwise silently turn every historical
    # "8 made" into "8 feet away".
    metric_type: Mapped[str | None] = mapped_column(Text)

    # How the block felt: 1 rough, 2 ok, 3 dialed, NULL not rated. The column
    # successful_reps should have been all along.
    feel: Mapped[int | None] = mapped_column(SmallInteger)

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

    __table_args__ = (
        Index("idx_practice_drill_runs_session", "session_id"),
        Index("idx_practice_drill_runs_session_order", "session_id", "order_index"),
        Index("idx_practice_drill_runs_drill", "drill_id"),
    )
