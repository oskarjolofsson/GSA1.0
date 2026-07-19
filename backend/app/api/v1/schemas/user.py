from pydantic import BaseModel, ConfigDict
from typing import Literal
from uuid import UUID
from datetime import datetime
from core.services.dtos.user_service_dto import GetUserDTO
from core.services.dtos.subscription import PageDTO


class SetUserRoleRequest(BaseModel):
    role: Literal["user", "admin"]

class GetUser(BaseModel):
    id: UUID
    email: str
    name: str
    
    role: str | None = None
    authProvider: str | None = None
    active: bool | None = None
    analysesCount: int | None = None
    drillsCompleted: int | None = None
    
    created_at: datetime
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
    
    @classmethod
    def from_domain(cls, dto: GetUserDTO) -> "GetUser":
        """Convert GetUserDTO to GetUser schema."""
        return cls(
            id=dto.id,
            email=dto.email,
            name=dto.name,
            role=dto.role,
            authProvider=dto.auth_provider,
            active=dto.active,
            analysesCount=dto.analyses_count,
            drillsCompleted=dto.drills_completed,
            created_at=dto.created_at,
            updated_at=dto.updated_at,
        )


class GetUserPageResponse(BaseModel):
    items: list[GetUser]
    total: int
    limit: int
    offset: int

    @classmethod
    def from_domain(cls, page: PageDTO[GetUserDTO]) -> "GetUserPageResponse":
        return cls(
            items=[GetUser.from_domain(item) for item in page.items],
            total=page.total,
            limit=page.limit,
            offset=page.offset,
        )