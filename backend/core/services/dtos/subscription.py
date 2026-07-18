from uuid import UUID
from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class SubscriberDTO(BaseModel):
    # Profile of the subscriber
    user_id: UUID
    name: str
    email: str

    # Active subscription
    subscription_id: UUID
    provider: str
    status: str
    current_period_end: datetime | None


class ProfileMatchDTO(BaseModel):
    # A profile matched by the admin search, annotated with whether they
    # currently have an active subscription (drives grant vs. "already
    # subscribed" in the dashboard).
    user_id: UUID
    name: str
    email: str

    subscribed: bool
    provider: str | None = None
    subscription_id: UUID | None = None


class PageDTO(BaseModel, Generic[T]):
    items: list[T]
    total: int
    limit: int
    offset: int
