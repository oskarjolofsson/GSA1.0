import uuid

from sqlalchemy import DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from ..base import Base


class BillingCustomer(Base):
    __tablename__ = "billing_customers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
    )

    provider: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        server_default="stripe",
    )

    customer_id: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        unique=True,
    )

    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    subscriptions = relationship(
        "BillingSubscription",
        back_populates="billing_customer",
        cascade="all, delete-orphan",
    )
