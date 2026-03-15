from dataclasses import dataclass
from uuid import UUID
from datetime import datetime


@dataclass(frozen=True)
class StartPracticeSessionDTO:
    user_id: UUID
    analysis_issue_id: UUID | None = None


@dataclass(frozen=True)
class PracticeSessionResponseDTO:
    id: UUID
    user_id: UUID
    analysis_issue_id: UUID | None
    status: str
    started_at: datetime
    completed_at: datetime | None


@dataclass(frozen=True)
class StartDrillRunDTO:
    session_id: UUID
    drill_id: UUID
    order_index: int | None = None


@dataclass(frozen=True)
class PracticeDrillRunResponseDTO:
    id: UUID
    session_id: UUID
    drill_id: UUID
    status: str
    successful_reps: int
    failed_reps: int
    skipped: bool
    started_at: datetime
    completed_at: datetime | None
    
    
@dataclass(frozen=True)
class CompleteDrillRunDTO:
    drill_run_id: UUID
    successful_reps: int
    failed_reps: int
    skipped: bool


@dataclass(frozen=True)
class RecordRepCompletionDTO:
    drill_run_id: UUID
    rep_number: int
    success: bool


@dataclass(frozen=True)
class PracticeRepResponseDTO:
    id: UUID
    drill_run_id: UUID
    rep_number: int
    success: bool
    created_at: datetime
