from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(frozen=True)
class IssueCandidate:
    """An issue the AI may pick under one law. `rank` is the coach's ranking under that
    law (1 = breaks it most often): a hint for the AI, not the answer."""

    issue_id: UUID
    rank: int
    title: str
    description: str
    current_motion: str | None = None
    expected_motion: str | None = None


@dataclass(frozen=True)
class LawCandidate:
    """A law of ball flight that could explain the golfer's miss, with the issues in the
    golfer's area that break it, in the coach's rank order."""

    key: str
    label: str
    golfer_label: str
    blurb: str | None
    issues: tuple[IssueCandidate, ...]


@dataclass(frozen=True)
class ChosenIssue:
    issue_id: UUID
    confidence: float


@dataclass(frozen=True)
class ValidatedResult:
    """The AI's answer after validation: a candidate law, and at most MAX_ISSUES issues
    under that law, highest confidence first. `issues` may be empty; the analysis still
    completes with the law alone."""

    law: str
    issues: tuple[ChosenIssue, ...]


# ------------------------------ service inputs and outputs ------------------------------


@dataclass(frozen=True)
class CreateAnalysisV2DTO:
    user_id: UUID
    area: str
    miss: str
    notes: str | None = None
    club_type: str | None = None
    camera_view: str | None = None


@dataclass(frozen=True)
class CreatedAnalysisDTO:
    analysis_id: UUID
    upload_url: str


@dataclass(frozen=True)
class AnalysisStatusDTO:
    analysis_id: UUID
    status: str
    error_message: str | None = None


@dataclass(frozen=True)
class AnalysisDrillDTO:
    drill_id: UUID
    title: str
    task: str
    success_signal: str
    fault_indicator: str


@dataclass(frozen=True)
class AnalysisIssueDetailDTO:
    analysis_issue_id: UUID
    issue_id: UUID
    title: str
    description: str
    layman_title: str | None
    layman_desc: str | None
    confidence: float | None
    drills: tuple[AnalysisDrillDTO, ...]


@dataclass(frozen=True)
class AnalysisDetailsDTO:
    """A completed analysis. Area, miss and law come as keys; the client already holds
    their labels from /taxonomy/. Issues are highest confidence first."""

    analysis_id: UUID
    video_id: UUID | None
    status: str
    area: str | None
    miss: str | None
    notes: str | None
    club_type: str | None
    camera_view: str | None
    law: str | None
    issues: tuple[AnalysisIssueDetailDTO, ...]
    created_at: datetime
    completed_at: datetime | None
