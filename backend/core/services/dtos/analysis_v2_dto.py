from dataclasses import dataclass
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
