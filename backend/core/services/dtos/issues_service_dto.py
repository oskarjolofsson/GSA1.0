from uuid import UUID
from dataclasses import dataclass


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
class IssueResponseDTO:
    id: UUID
    title: str
    phase: str | None
    current_motion: str | None
    expected_motion: str | None
    swing_effect: str | None
    shot_outcome: str | None
    created_at: str
