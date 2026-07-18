from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from core.services.dtos.subscription import PageDTO, ProfileMatchDTO, SubscriberDTO


class SubscriberResponse(BaseModel):
    user_id: UUID
    name: str
    email: str

    subscription_id: UUID
    provider: str
    status: str
    current_period_end: datetime | None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_domain(cls, dto: SubscriberDTO) -> "SubscriberResponse":
        return cls(
            user_id=dto.user_id,
            name=dto.name,
            email=dto.email,
            subscription_id=dto.subscription_id,
            provider=dto.provider,
            status=dto.status,
            current_period_end=dto.current_period_end,
        )


class SubscriberPageResponse(BaseModel):
    items: list[SubscriberResponse]
    total: int
    limit: int
    offset: int

    @classmethod
    def from_domain(cls, page: PageDTO[SubscriberDTO]) -> "SubscriberPageResponse":
        return cls(
            items=[SubscriberResponse.from_domain(item) for item in page.items],
            total=page.total,
            limit=page.limit,
            offset=page.offset,
        )


class ProfileMatchResponse(BaseModel):
    user_id: UUID
    name: str
    email: str

    subscribed: bool
    provider: str | None = None
    subscription_id: UUID | None = None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_domain(cls, dto: ProfileMatchDTO) -> "ProfileMatchResponse":
        return cls(
            user_id=dto.user_id,
            name=dto.name,
            email=dto.email,
            subscribed=dto.subscribed,
            provider=dto.provider,
            subscription_id=dto.subscription_id,
        )


class GrantSubscriptionRequest(BaseModel):
    user_id: UUID
