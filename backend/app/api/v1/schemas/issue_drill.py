from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime


class CreateIssueDrillRequest(BaseModel):
    issue_id: UUID
    drill_id: UUID


class CreateIssueDrillResponse(BaseModel):
    success: bool
    issue_drill_id: UUID


class GetIssueDrill(BaseModel):
    id: UUID
    issue_id: UUID
    drill_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_domain(cls, dto) -> "GetIssueDrill":
        """Convert IssueDrillResponseDTO to GetIssueDrill schema."""
        return cls(
            id=dto.id,
            issue_id=dto.issue_id,
            drill_id=dto.drill_id,
            created_at=dto.created_at,
        )


class DeleteIssueDrillResponse(BaseModel):
    success: bool
