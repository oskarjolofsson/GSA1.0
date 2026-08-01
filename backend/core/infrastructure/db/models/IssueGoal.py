from ..base import Base
import uuid
from sqlalchemy import Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship


class IssueGoal(Base):
    """Tags an issue with a golfer goal (WHY they practice). Many-to-many:
    one issue can serve several goals; one goal lists several issues."""

    __tablename__ = "issue_goals"

    issue_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("issues.id", ondelete="CASCADE"),
        primary_key=True,
    )
    # References taxonomy_goals. RESTRICT so removing a goal still in use fails loudly.
    goal: Mapped[str] = mapped_column(
        Text,
        ForeignKey("taxonomy_goals.key", ondelete="RESTRICT"),
        primary_key=True,
    )

    issue = relationship("Issue", back_populates="goals")
