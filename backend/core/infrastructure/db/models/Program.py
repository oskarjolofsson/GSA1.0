from ..base import Base
import uuid
from sqlalchemy import (
    Text,
    DateTime,
    Integer,
    CheckConstraint,
    Index,
    ForeignKey,
    text,
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

    # Which part of the game this program grooves, copied from the issue at creation.
    #
    # Stored rather than joined because the two-per-area cap is a partial unique index and
    # an index cannot reach through the issue_id foreign key. That is the only reason the
    # column exists.
    #
    # Frozen once set: it must NOT follow the issue if an admin later re-files it. A
    # program is a commitment to specific work, so re-labelling one mid-flight would both
    # rename what the golfer thinks they are doing and shuffle which slot they occupy.
    # Same call, same reasoning, as PracticeSession.area. The resulting drift is cosmetic
    # and ends when the program completes.
    area: Mapped[str | None] = mapped_column(
        Text,
        ForeignKey("taxonomy_areas.key", ondelete="RESTRICT"),
    )

    # Which of the two per-area slots this program occupies.
    #
    # "At most two active programs per area" is not expressible as a unique index on its
    # own, and counting rows in Python before inserting is a read-then-write race. Naming
    # the slot turns the cap into ordinary uniqueness -- see the partial unique index
    # programs_one_active_per_area_slot -- which Postgres settles atomically.
    slot: Mapped[int] = mapped_column(
        Integer,
        CheckConstraint("slot IN (0,1)"),
        nullable=False,
        server_default="0",
    )

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
        Index("idx_programs_user_active_area", "user_id", "status", "area"),
        # The two-per-area cap. Partial on status so completing or abandoning a program
        # frees its slot with no extra bookkeeping. This index -- not the Python check in
        # program_service._allocate_slot -- is the authority; the Python exists only to
        # produce a better error message than an IntegrityError.
        Index(
            "programs_one_active_per_area_slot",
            "user_id",
            "area",
            "slot",
            unique=True,
            postgresql_where=text("status = 'active'"),
        ),
        # One active program per issue. Two programs on the same issue would groove
        # identical drill sets against separate counters with nothing to make them diverge.
        Index(
            "programs_one_active_per_issue",
            "user_id",
            "issue_id",
            unique=True,
            postgresql_where=text("status = 'active'"),
        ),
    )
