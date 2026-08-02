from dataclasses import dataclass, field
from uuid import UUID

from .issue_authoring_service_dto import CatalogDrillDTO


@dataclass
class AdminIssueDTO:
    """An issue with everything the catalog editor needs.

    Wider than CatalogIssueDTO (which is shaped for the golfer-facing library):
    carries ownership, the coach-vocabulary motion fields and created_at.
    """

    id: UUID
    title: str
    description: str | None
    area: str
    kind: str
    source: str
    user_id: UUID | None
    layman_title: str | None = None
    layman_desc: str | None = None
    current_motion: str | None = None
    expected_motion: str | None = None
    swing_effect: str | None = None
    shot_outcome: str | None = None
    created_at: str | None = None
    goals: list[str] = field(default_factory=list)
    misses: list[str] = field(default_factory=list)
    drills: list[CatalogDrillDTO] = field(default_factory=list)


@dataclass
class AdminIssueRefDTO:
    id: UUID
    title: str


@dataclass
class AdminDrillDTO:
    id: UUID
    title: str
    task: str
    success_signal: str
    fault_indicator: str
    user_id: UUID | None
    created_at: str | None = None
    issues: list[AdminIssueRefDTO] = field(default_factory=list)


@dataclass
class DeleteImpactDTO:
    """What a delete would take with it.

    Most of these rows CASCADE away silently. `drill_runs` is the exception:
    practice_drill_runs.drill_id is ON DELETE NO ACTION, so a drill with recorded
    practice runs cannot be deleted at all — the database refuses it.
    """

    analysis_issues: int = 0
    programs: int = 0
    practice_sessions: int = 0
    program_drill_states: int = 0
    drill_runs: int = 0
    mappings: int = 0

    @property
    def blocking(self) -> bool:
        """True when the delete would destroy or be refused over referencing rows."""
        return any(
            (
                self.analysis_issues,
                self.programs,
                self.practice_sessions,
                self.program_drill_states,
                self.drill_runs,
                self.mappings,
            )
        )

    @property
    def refused_by_database(self) -> bool:
        """True when the delete cannot succeed regardless of confirmation."""
        return self.drill_runs > 0


@dataclass
class CoverageCellDTO:
    area: str
    miss: str | None
    goal: str | None
    issue_count: int


@dataclass
class CoverageDTO:
    cells: list[CoverageCellDTO] = field(default_factory=list)
    unmapped_drills: int = 0
    issues_with_no_drills: int = 0

    # Issues carrying no miss or no goal tag. They cannot appear in any (area, miss, goal)
    # cell, so without this count they stay invisible in the very tool meant to surface
    # gaps — which is what the old inner joins did to them silently.
    untagged_issues: int = 0
