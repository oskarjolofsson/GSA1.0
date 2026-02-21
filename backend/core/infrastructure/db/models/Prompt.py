from ..base import Base
import uuid
from sqlalchemy import (
    Text,
    DateTime,
    ForeignKey,
    Index,
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

    prompt_shape: Mapped[str | None] = mapped_column(Text, nullable=True)
    prompt_height: Mapped[str | None] = mapped_column(Text, nullable=True)
    prompt_misses: Mapped[str | None] = mapped_column(Text, nullable=True)
    prompt_extra: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # Relationship
    analysis = relationship("Analysis", back_populates="prompt")

    __table_args__ = (Index("idx_prompts_analysis_id", "analysis_id"),)