from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime


class StartPracticeSessionRequest(BaseModel):
    analysis_issue_id: UUID | None = None
    session_type: str | None = None  # 'range' | 'play' | 'retest'
    notes: str | None = None


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
    drill_title: str
    session_id: UUID
    # Nullable: a run outlives the drill it practised, so history survives a catalog
    # cleanup instead of blocking it.
    drill_id: UUID | None
    status: str
    # FROZEN. Carried the block-feel ordinal before `feel` existed. Still sent because
    # builds in the wild read it; nothing new should. Defaulted so a current client can
    # omit it -- this schema doubles as the completion request body.
    successful_reps: int = 0
    failed_reps: int
    skipped: bool
    started_at: datetime
    completed_at: datetime | None
    # How the block went. `feel` for a tapped rough/ok/dialed (1-3), `metric_value` for a
    # counted score in the drill's own units, `metric_type` for how to read that number.
    # `grade` is what the value was worth, derived server-side -- the client never owns
    # the thresholds.
    feel: int | None = None
    metric_value: float | None = None
    metric_type: str | None = None
    grade: str | None = None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_domain(cls, dto) -> "PracticeDrillRun":
        """Convert PracticeDrillRunResponseDTO to schema response."""
        return cls(
            id=dto.id,
            drill_title=dto.drill_title,
            session_id=dto.session_id,
            drill_id=dto.drill_id,
            status=dto.status,
            successful_reps=dto.successful_reps,
            failed_reps=dto.failed_reps,
            skipped=dto.skipped,
            started_at=dto.started_at,
            completed_at=dto.completed_at,
            feel=dto.feel,
            metric_value=dto.metric_value,
            metric_type=dto.metric_type,
            grade=dto.grade,
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
