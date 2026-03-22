from uuid import UUID
from dataclasses import dataclass
from datetime import datetime


@dataclass
class CreateIssueDTO:
    title: str
    phase: str | None = None
    current_motion: str | None = None
    expected_motion: str | None = None
    swing_effect: str | None = None
    shot_outcome: str | None = None


@dataclass
class UpdateIssueDTO:
    title: str | None = None
    phase: str | None = None
    current_motion: str | None = None
    expected_motion: str | None = None
    swing_effect: str | None = None
    shot_outcome: str | None = None


@dataclass
class IssueProgressDTO:
    """Progress tracking for an analysis issue."""
    completed_sessions: int
    in_progress_sessions: int
    abandoned_sessions: int
    total_successful_reps: int
    total_failed_reps: int
    total_reps: int
    overall_success_rate: float | None
    recent_session_success_rates: list[float]
    trend: str
    last_completed_at: datetime | None = None


@dataclass
class IssueResponseDTO:
    id: UUID
    title: str
    phase: str | None
    current_motion: str | None
    expected_motion: str | None
    swing_effect: str | None
    shot_outcome: str | None
    created_at: str
    analysis_issue_id: str | None = None
    analysis_id: str | None = None
    confidence: float | None = None
    progress: IssueProgressDTO | None = None
