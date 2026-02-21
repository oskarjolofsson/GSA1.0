from ..base import Base
import uuid
from sqlalchemy import (
    Text,
    DateTime,
)
from sqlalchemy.dialects.postgresql import UUID
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

    title: Mapped[str] = mapped_column(Text, nullable=False)
    task: Mapped[str] = mapped_column(Text, nullable=False)
    success_signal: Mapped[str] = mapped_column(Text, nullable=False)
    fault_indicator: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # Relationship to issue_drill
    issue_drills = relationship(
        "IssueDrill",
        back_populates="drill",
        cascade="all, delete-orphan",
    )