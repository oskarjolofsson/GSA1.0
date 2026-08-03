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
    drill_title: str
    session_id: UUID
    drill_id: UUID | None
    status: str
    # FROZEN. This column held a feel ordinal, never a rep count; `feel` replaces it.
    successful_reps: int
    failed_reps: int
    skipped: bool
    started_at: datetime
    completed_at: datetime | None
    # How the block went, and how to read it. `grade` is derived from metric_value against
    # the drill's current thresholds, never stored -- so a results screen shows the number
    # and what it was worth without the client owning the rules.
    feel: int | None = None
    metric_value: float | None = None
    metric_type: str | None = None
    grade: str | None = None

    
@dataclass(frozen=True)
class CompleteDrillRunDTO:
    drill_run_id: UUID
    successful_reps: int
    failed_reps: int
    skipped: bool
    # How the block went. A drill is scored one way or the other, never both:
    # `feel` for a rough/ok/dialed tap, `metric_value` for a counted score. Both stay
    # None when the golfer skipped the rating.
    feel: int | None = None
    metric_value: float | None = None


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
