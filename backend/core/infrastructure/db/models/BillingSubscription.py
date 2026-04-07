import uuid

from sqlalchemy import Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from ..base import Base


class BillingSubscription(Base):
    __tablename__ = "billing_subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    billing_customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("billing_customers.id", ondelete="CASCADE"),
        nullable=False,
    )

    stripe_subscription_id: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        unique=True,
    )

    stripe_price_id: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    stripe_status: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    current_period_start: Mapped[DateTime | None] = mapped_column(
        DateTime(timezone=True),
    )

    current_period_end: Mapped[DateTime | None] = mapped_column(
        DateTime(timezone=True),
    )

    cancel_at_period_end: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default="false",
    )

    canceled_at: Mapped[DateTime | None] = mapped_column(
        DateTime(timezone=True),
    )

    ended_at: Mapped[DateTime | None] = mapped_column(
        DateTime(timezone=True),
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

    billing_customer = relationship(
        "BillingCustomer",
        back_populates="subscriptions",
    )
