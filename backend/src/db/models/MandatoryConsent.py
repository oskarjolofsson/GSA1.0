from ..db.base import Base
import uuid
from sqlalchemy import (
    Text,
)
from sqlalchemy.dialects.postgresql import UUID, INET
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, Mapped, mapped_column


class MandatoryConsent(Base):
    __tablename__ = "mandatory_consent"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    name: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
