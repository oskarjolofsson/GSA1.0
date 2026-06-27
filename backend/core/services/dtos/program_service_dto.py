from dataclasses import dataclass, field
from uuid import UUID
from datetime import datetime


@dataclass(frozen=True)
class DrillGradeDTO:
    """How a single drill block felt, fed back into the spaced-repetition state."""
    drill_id: UUID
    grade: str  # 'rough' | 'ok' | 'dialed'


@dataclass(frozen=True)
class ProgramStepDTO:
    id: UUID
    program_id: UUID
    order_index: int
    session_type: str  # 'range' | 'play' | 'retest'
    prescription: dict
    status: str  # 'pending' | 'completed' | 'skipped'
    practice_session_id: UUID | None


@dataclass(frozen=True)
class ProgramDTO:
    id: UUID
    user_id: UUID
    analysis_issue_id: UUID | None
    title: str
    status: str  # 'active' | 'completed' | 'abandoned'
    created_at: datetime
    # Open-ended program: progress is grooved-drill count, not an X/N step bar.
    grooved_count: int
    total_drills: int
    steps: list[ProgramStepDTO] = field(default_factory=list)


@dataclass(frozen=True)
class StepAdvanceDTO:
    """Result of completing a step: what was completed, what's scheduled next, and
    where the program stands now (grooved progress lives on the ProgramDTO)."""
    completed_step: ProgramStepDTO
    next_step: ProgramStepDTO | None
    program_status: str
    grooved_count: int
    total_drills: int
