from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime


class CreateDrillRequest(BaseModel):
    title: str
    task: str
    success_signal: str
    fault_indicator: str


class CreateDrillResponse(BaseModel):
    success: bool
    drill_id: UUID


class GetDrill(BaseModel):
    id: UUID
    title: str
    task: str
    success_signal: str
    fault_indicator: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
    
    @classmethod
    def from_domain(cls, dto) -> "GetDrill":
        """Convert DrillResponseDTO to GetDrill schema."""
        return cls(
            id=dto.id,
            title=dto.title,
            task=dto.task,
            success_signal=dto.success_signal,
            fault_indicator=dto.fault_indicator,
            created_at=dto.created_at,
        )


class UpdateDrillRequest(BaseModel):
    title: str | None = None
    task: str | None = None
    success_signal: str | None = None
    fault_indicator: str | None = None


class BulkDeleteDrillsRequest(BaseModel):
    drill_ids: list[UUID]