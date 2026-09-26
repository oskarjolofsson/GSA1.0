from ..base import Base
import uuid
from sqlalchemy import (
    Text,
    DateTime,
    ForeignKey,
    Index,
    CheckConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, Mapped, mapped_column


class Prompt(Base):
    __tablename__ = "prompts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    analysis_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("analysis.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    # v1 inputs. Null on v2 analyses, which write the area/miss/notes/club_type/camera_view columns below.
    prompt_shape: Mapped[str | None] = mapped_column(Text, nullable=True)
    prompt_height: Mapped[str | None] = mapped_column(Text, nullable=True)
    prompt_misses: Mapped[str | None] = mapped_column(Text, nullable=True)
    prompt_extra: Mapped[str | None] = mapped_column(Text, nullable=True)

    # v2 inputs. Null on v1 analyses, which only write the prompt_* columns above.
    # RESTRICT: retire a term with active = false rather than deleting it.
    area: Mapped[str | None] = mapped_column(
        Text, ForeignKey("taxonomy_areas.key", ondelete="RESTRICT")
    )
    miss: Mapped[str | None] = mapped_column(
        Text, ForeignKey("taxonomy_misses.key", ondelete="RESTRICT")
    )
    notes: Mapped[str | None] = mapped_column(Text)

    # Null means "not given": areas other than full swing may not ask for them.
    # club_type can be anything, just an indication by user of what they used. camera_view is restricted to the two known values, but null means "not given".
    club_type: Mapped[str | None] = mapped_column(Text)
    camera_view: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    analysis = relationship("Analysis", back_populates="prompt")

    __table_args__ = (
        Index("idx_prompts_analysis_id", "analysis_id"),
        CheckConstraint(
            "camera_view IN ('face_on', 'down_the_line')",
            name="prompts_camera_view_check",
        ),
    )
