from dataclasses import dataclass, field
from uuid import UUID


@dataclass
class DraftDrillDTO:
    title: str
    task: str
    success_signal: str
    fault_indicator: str
    # Field names the AI inferred rather than took from the coach — surfaced so the
    # user reviews them before confirming.
    ai_filled: list[str] = field(default_factory=list)


@dataclass
class DraftIssueDTO:
    title: str
    description: str
    area: str = "FULL_SWING"
    kind: str = "fault"
    miss: str | None = None
    goals: list[str] = field(default_factory=list)
    layman_title: str | None = None
    layman_desc: str | None = None


@dataclass
class CatalogDrillDTO:
    id: UUID
    title: str
    task: str
    success_signal: str
    fault_indicator: str


@dataclass
class CatalogIssueDTO:
    """An existing issue (catalog or the user's own custom) with its drills — used
    both for browse listings and for dedup suggestions."""
    id: UUID
    title: str
    description: str | None
    area: str
    kind: str
    source: str
    layman_title: str | None = None
    layman_desc: str | None = None
    goals: list[str] = field(default_factory=list)
    misses: list[str] = field(default_factory=list)
    drills: list[CatalogDrillDTO] = field(default_factory=list)


@dataclass
class FeedbackDraftDTO:
    issue: DraftIssueDTO
    drills: list[DraftDrillDTO] = field(default_factory=list)
    # Existing catalog issues that look like this feedback; empty when nothing close.
    similar_issues: list[CatalogIssueDTO] = field(default_factory=list)
