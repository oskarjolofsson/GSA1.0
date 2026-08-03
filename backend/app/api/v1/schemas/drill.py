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
    # Where on the course this drill belongs. NULL = any.
    area: str | None = None
    # How the drill is scored, or NULL for feel-only. The app switches its rating
    # UI on `metric.type` and MUST keep a default branch: this field is authored in
    # the admin CMS, so a build in the wild can receive a type it has never heard of.
    # Shape: {type, reps, grade_at:{dialed,ok}, label?, unit?, lower_is_better?, ceiling?}
    metric: dict | None = None

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
            area=dto.area,
            metric=dto.metric,
        )


class UpdateDrillRequest(BaseModel):
    title: str | None = None
    task: str | None = None
    success_signal: str | None = None
    fault_indicator: str | None = None


class BulkDeleteDrillsRequest(BaseModel):
    drill_ids: list[UUID]