from ..db.base import Base
import uuid
from sqlalchemy import (
    Text,
    DateTime,
    Boolean,
    ForeignKey,
)
from sqlalchemy.dialects.postgresql import UUID, INET
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, Mapped, mapped_column


class UserConsent(Base):
    __tablename__ = "user_consent"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("auth.users.id", ondelete="CASCADE"),
        primary_key=True,
    )

    mandatory_consent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("mandatory_consent.id"),
        primary_key=True,
    )

    granted: Mapped[bool] = mapped_column(Boolean, nullable=False)

    granted_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    ip_address: Mapped[str | None] = mapped_column(INET)
    user_agent: Mapped[str | None] = mapped_column(Text)
