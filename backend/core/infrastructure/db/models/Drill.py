from ..base import Base
import uuid
from sqlalchemy import (
    Text,
    DateTime,
    ForeignKey,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, Mapped, mapped_column
from .IssueDrill import IssueDrill


class Drill(Base):
    __tablename__ = "drills"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # Owner of a user-authored (custom) drill. NULL = admin-curated global catalog.
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))

    title: Mapped[str] = mapped_column(Text, nullable=False)
    task: Mapped[str] = mapped_column(Text, nullable=False)
    success_signal: Mapped[str] = mapped_column(Text, nullable=False)
    fault_indicator: Mapped[str] = mapped_column(Text, nullable=False)

    # Which part of the game this drill trains. NULL = any: a mirror drill or a tempo
    # drill is not about a place on the course.
    area: Mapped[str | None] = mapped_column(
        Text,
        ForeignKey("taxonomy_areas.key", ondelete="RESTRICT"),
    )

    # How the drill is scored, or NULL for feel-only (rough/ok/dialed) -- which is every
    # drill that existed before Slice B. Shape and thresholds live in
    # core/services/drill_metrics.py; see the migration for the authored examples.
    #
    # none_as_null is load-bearing, not tidiness: without it SQLAlchemy writes Python None
    # as the JSON value `null` rather than SQL NULL. That is a real, distinct state --
    # jsonb_typeof() returns 'null', `metric IS NULL` is false, and a feel-only drill would
    # look like a drill whose metric is deliberately blank.
    metric: Mapped[dict | None] = mapped_column(JSONB(none_as_null=True))

    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    issue_drills = relationship(
        "IssueDrill",
        back_populates="drill",
        cascade="all, delete-orphan",
    )