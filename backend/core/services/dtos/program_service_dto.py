from dataclasses import dataclass, field
from uuid import UUID
from datetime import datetime


@dataclass(frozen=True)
class DrillGradeDTO:
    """How a single drill block went, fed back into the spaced-repetition state.

    Two ways to fill this in, and a client sends exactly one of them:

      grade         a feel block. The golfer tapped rough/ok/dialed, and there is nothing
                    to derive -- their word is the measurement.
      metric_value  a scored block. The raw number in the drill's own units (8 putts made,
                    4.2 feet). The server grades it against the drill's current thresholds.

    A scored drill never sends `grade`. `grade_at` is admin-editable content, so a build
    that shipped before a threshold was retuned would otherwise keep grading on numbers
    nobody can see any more.
    """
    drill_id: UUID
    grade: str | None = None  # 'rough' | 'ok' | 'dialed'
    metric_value: float | None = None


@dataclass(frozen=True)
class StepDrillDTO:
    """A drill referenced by a range step, resolved to its title at read time
    (computed, not stored in the step's prescription)."""
    id: UUID
    title: str


@dataclass(frozen=True)
class ProgramStepDTO:
    id: UUID
    program_id: UUID
    order_index: int
    session_type: str  # 'range' | 'play' | 'retest'
    prescription: dict
    status: str  # 'pending' | 'completed' | 'skipped'
    practice_session_id: UUID | None
    drills: list[StepDrillDTO] = field(default_factory=list)


@dataclass(frozen=True)
class ProgramDTO:
    id: UUID
    user_id: UUID
    analysis_issue_id: UUID | None
    issue_id: UUID | None
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
