from ..base import Base
import uuid
from sqlalchemy import (
    DateTime,
    Index,
    UniqueConstraint,
    ForeignKey,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, Mapped, mapped_column

from .Issue import Issue
from .Drill import Drill


class IssueDrill(Base):
    __tablename__ = "issue_drill"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    issue_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("issues.id", ondelete="CASCADE"),
        nullable=False,
    )

    drill_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("drills.id", ondelete="CASCADE"),
        nullable=False,
    )

    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # Relationships
    issue = relationship("Issue", back_populates="issue_drills")
    drill = relationship("Drill", back_populates="issue_drills")

    __table_args__ = (
        UniqueConstraint("issue_id", "drill_id", name="uq_issue_drill"),
        Index("idx_issue_drill_issue_id", "issue_id"),
        Index("idx_issue_drill_drill_id", "drill_id"),
    )
