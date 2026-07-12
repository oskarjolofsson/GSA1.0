from ..base import Base
import uuid
from sqlalchemy import Text, CheckConstraint, ForeignKey
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
    goal: Mapped[str] = mapped_column(
        Text,
        CheckConstraint(
            "goal IN ('STRAIGHTER','DISTANCE','CONTACT','BIG_MISS','SHORT_GAME','PUTTING')"
        ),
        primary_key=True,
    )

    issue = relationship("Issue", back_populates="goals")
