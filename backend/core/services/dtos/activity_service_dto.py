from dataclasses import dataclass
from uuid import UUID
from datetime import date, datetime


@dataclass(frozen=True)
class ActivityCountDTO:
    """One contribution-graph square: a day and how many activities it had."""
    occurred_on: date
    count: int


@dataclass(frozen=True)
class ActivityDrillRunDTO:
    """A drill run nested inside a day-detail practice session."""
    id: UUID
    drill_id: UUID
    drill_title: str
    successful_reps: int
    failed_reps: int
    skipped: bool
    started_at: datetime
    completed_at: datetime | None


@dataclass(frozen=True)
class ActivitySessionDTO:
    """A completed practice session that occurred on the requested day."""
    id: UUID
    status: str
    started_at: datetime
    completed_at: datetime | None
    analysis_issue_id: UUID | None
    drill_runs: list[ActivityDrillRunDTO]


@dataclass(frozen=True)
class ActivityAnalysisDTO:
    """A completed successful analysis that occurred on the requested day."""
    id: UUID
    status: str
    created_at: datetime
    completed_at: datetime | None
    thumbnail_url: str | None


@dataclass(frozen=True)
class ActivityDayDetailDTO:
    """Everything that happened on a single day, for the tap-through detail view."""
    date: date
    sessions: list[ActivitySessionDTO]
    analyses: list[ActivityAnalysisDTO]
