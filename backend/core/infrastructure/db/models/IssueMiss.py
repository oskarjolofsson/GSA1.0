from ..base import Base
import uuid
from sqlalchemy import Text, CheckConstraint, ForeignKey
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
    miss: Mapped[str] = mapped_column(
        Text,
        CheckConstraint(
            "miss IN ('SLICE','HOOK','PULL','PUSH','TOP','THIN','FAT','LOW_WEAK')"
        ),
        primary_key=True,
    )

    issue = relationship("Issue", back_populates="misses")
