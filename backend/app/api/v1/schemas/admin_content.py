from uuid import UUID

from pydantic import BaseModel

from app.api.v1.schemas.issue import CatalogDrillSchema, DraftDrillSchema


class AdminIssueSchema(BaseModel):
    """An issue as the content admin sees it.

    Distinct from GetIssue, which is shaped for the analysis flow and carries
    progress and analysis linkage the admin has no use for. This one carries what
    the catalog editor needs: ownership, tags and the linked drills.
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
    goals: list[str] = []
    misses: list[str] = []
    drills: list[CatalogDrillSchema] = []
    drill_count: int = 0

    @classmethod
    def from_domain(cls, dto) -> "AdminIssueSchema":
        return cls(
            id=dto.id,
            title=dto.title,
            description=dto.description,
            area=dto.area,
            kind=dto.kind,
            source=dto.source,
            user_id=dto.user_id,
            layman_title=dto.layman_title,
            layman_desc=dto.layman_desc,
            current_motion=dto.current_motion,
            expected_motion=dto.expected_motion,
            swing_effect=dto.swing_effect,
            shot_outcome=dto.shot_outcome,
            created_at=dto.created_at,
            goals=dto.goals,
            misses=dto.misses,
            drills=[CatalogDrillSchema.from_domain(d) for d in dto.drills],
            drill_count=len(dto.drills),
        )


class AdminIssuePageResponse(BaseModel):
    items: list[AdminIssueSchema]
    total: int
    limit: int
    offset: int


class AdminIssueRefSchema(BaseModel):
    """Just enough of an issue to show what a drill is attached to."""

    id: UUID
    title: str


class AdminDrillSchema(BaseModel):
    id: UUID
    title: str
    task: str
    success_signal: str
    fault_indicator: str
    user_id: UUID | None
    created_at: str | None = None
    issues: list[AdminIssueRefSchema] = []
    issue_count: int = 0

    @classmethod
    def from_domain(cls, dto) -> "AdminDrillSchema":
        return cls(
            id=dto.id,
            title=dto.title,
            task=dto.task,
            success_signal=dto.success_signal,
            fault_indicator=dto.fault_indicator,
            user_id=dto.user_id,
            created_at=dto.created_at,
            issues=[AdminIssueRefSchema(id=i.id, title=i.title) for i in dto.issues],
            issue_count=len(dto.issues),
        )


class AdminDrillPageResponse(BaseModel):
    items: list[AdminDrillSchema]
    total: int
    limit: int
    offset: int


class ComposeIssueRequest(BaseModel):
    """Create or replace an issue together with its tags and drill links.

    One request rather than the six writes the catalog used to need (issue, goal
    tags, miss tags, drills, links) — they share the request transaction, so a
    failure anywhere leaves nothing behind.
    """

    title: str
    description: str = ""
    area: str = "FULL_SWING"
    kind: str = "fault"
    layman_title: str | None = None
    layman_desc: str | None = None
    current_motion: str | None = None
    expected_motion: str | None = None
    swing_effect: str | None = None
    shot_outcome: str | None = None
    misses: list[str] = []
    goals: list[str] = []
    new_drills: list[DraftDrillSchema] = []
    existing_drill_ids: list[UUID] = []


class UpdateAdminIssueRequest(BaseModel):
    """Partial update of a catalog issue.

    Three-state on the nullable text fields, matching issues_service.update_issue:
    omit to leave a field alone, send "" to clear it, send text to set it. Tags work
    the same way — omit to keep, [] to remove them all, a list to replace the set.

    `source` and `user_id` are deliberately absent. The admin edits content, never
    ownership; reassigning a golfer's issue to the catalog is not something a text
    form should be able to do by accident.
    """

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
    misses: list[str] | None = None
    goals: list[str] | None = None


class UpdateAdminDrillRequest(BaseModel):
    title: str | None = None
    task: str | None = None
    success_signal: str | None = None
    fault_indicator: str | None = None


class CreateAdminDrillRequest(BaseModel):
    title: str
    task: str
    success_signal: str
    fault_indicator: str


class DeleteImpactResponse(BaseModel):
    """What a delete would take with it.

    Every count is a row that CASCADEs away with the record, most of them belonging
    to real users. `blocking` is true when anything at all references it, which is
    what makes the caller pass ?confirm_impact=true.
    """

    analysis_issues: int = 0
    programs: int = 0
    practice_sessions: int = 0
    drill_runs: int = 0
    mappings: int = 0
    blocking: bool = False


class CoverageCellSchema(BaseModel):
    area: str
    miss: str | None
    goal: str | None
    issue_count: int


class CoverageResponse(BaseModel):
    """Which parts of the taxonomy have content and which are empty.

    Cells with issue_count 0 are gaps: a golfer picking that goal and miss finds
    nothing to practise.
    """

    cells: list[CoverageCellSchema]
    unmapped_drills: int
    issues_with_no_drills: int
