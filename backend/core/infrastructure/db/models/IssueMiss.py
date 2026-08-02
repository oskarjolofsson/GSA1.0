from ..base import Base
import uuid
from sqlalchemy import Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship


class IssueMiss(Base):
    """Tags an issue with a ball-flight miss (WHAT the golfer sees). Many-to-many:
    one miss (e.g. SLICE) maps to several issues; one issue can cause several misses.
    This is the golfer-facing entry axis for the library."""

    __tablename__ = "issue_misses"

    issue_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("issues.id", ondelete="CASCADE"),
        primary_key=True,
    )
    # References taxonomy_misses, which scopes each miss to an area — a putt is not sliced.
    # RESTRICT so removing a miss that issues still carry fails loudly rather than silently
    # stripping tags off authored content.
    miss: Mapped[str] = mapped_column(
        Text,
        ForeignKey("taxonomy_misses.key", ondelete="RESTRICT"),
        primary_key=True,
    )

    issue = relationship("Issue", back_populates="misses")
