from uuid import UUID
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class CreateIssueDTO:
    title: str
    description: str
    area: str = "FULL_SWING"
    kind: str = "fault"
    current_motion: str | None = None
    expected_motion: str | None = None
    swing_effect: str | None = None
    shot_outcome: str | None = None
    layman_title: str | None = None
    layman_desc: str | None = None
    miss: str | None = None
    goals: list[str] = field(default_factory=list)


@dataclass
class UpdateIssueDTO:
    title: str | None = None
    description: str | None = None
    area: str | None = None
    kind: str | None = None
    current_motion: str | None = None
    expected_motion: str | None = None
    swing_effect: str | None = None
    shot_outcome: str | None = None
    layman_title: str | None = None
    layman_desc: str | None = None


@dataclass
class SimplifiedIssueProgressDTO:
    """Progress tracking for an analysis issue."""
    completed_sessions: int
    total_successful_reps: int
    overall_success_rate: float | None
    recent_session_success_rates: float | None       # Success rates for the most recent sessions, used for trend analysis
    delta: float | None
    last_completed_at: datetime | None = None


@dataclass
class IssueResponseDTO:
    id: UUID
    title: str
    description: str | None
    current_motion: str | None
    expected_motion: str | None
    swing_effect: str | None
    shot_outcome: str | None
    created_at: str
    area: str = "FULL_SWING"
    kind: str = "fault"
    layman_title: str | None = None
    layman_desc: str | None = None
    analysis_issue_id: str | None = None
    analysis_id: str | None = None
    confidence: float | None = None
    progress: SimplifiedIssueProgressDTO | None = None
    program_status: str | None = None  # 'active' | 'completed' | None
    source: str = "catalog"  # 'catalog' (admin) | 'custom' (user-authored)
