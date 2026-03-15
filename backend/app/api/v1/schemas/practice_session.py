from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime


class StartPracticeSessionRequest(BaseModel):
    analysis_issue_id: UUID | None = None


class PracticeSessionResponse(BaseModel):
    id: UUID
    user_id: UUID
    analysis_issue_id: UUID | None
    status: str
    started_at: datetime
    completed_at: datetime | None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_domain(cls, dto) -> "PracticeSessionResponse":
        """Convert PracticeSessionResponseDTO to schema response."""
        return cls(
            id=dto.id,
            user_id=dto.user_id,
            analysis_issue_id=dto.analysis_issue_id,
            status=dto.status,
            started_at=dto.started_at,
            completed_at=dto.completed_at,
        )


class StartDrillRunRequest(BaseModel):
    drill_id: UUID
    order_index: int | None = None


class PracticeDrillRun(BaseModel):
    id: UUID
    session_id: UUID
    drill_id: UUID
    status: str
    successful_reps: int
    failed_reps: int
    skipped: bool
    started_at: datetime
    completed_at: datetime | None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_domain(cls, dto) -> "PracticeDrillRun":
        """Convert PracticeDrillRunResponseDTO to schema response."""
        return cls(
            id=dto.id,
            session_id=dto.session_id,
            drill_id=dto.drill_id,
            status=dto.status,
            successful_reps=dto.successful_reps,
            failed_reps=dto.failed_reps,
            skipped=dto.skipped,
            started_at=dto.started_at,
            completed_at=dto.completed_at,
        )


class RecordRepRequest(BaseModel):
    rep_number: int
    success: bool


class PracticeRepResponse(BaseModel):
    id: UUID
    drill_run_id: UUID
    rep_number: int
    success: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_domain(cls, dto) -> "PracticeRepResponse":
        """Convert PracticeRepResponseDTO to schema response."""
        return cls(
            id=dto.id,
            drill_run_id=dto.drill_run_id,
            rep_number=dto.rep_number,
            success=dto.success,
            created_at=dto.created_at,
        )
