import uuid

from ..base import Base
from sqlalchemy import (
    UUID,
    Text,
    Integer,
    String,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column


class Permission(Base):
    __tablename__ = "permissions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        autoincrement=True,
    )

    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    role_permissions = relationship(
        "RolePermission",
        back_populates="permission",
        cascade="all, delete-orphan",
    )
