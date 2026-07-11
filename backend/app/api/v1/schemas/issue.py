from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime


class CreateIssueRequest(BaseModel):
    title: str
    description: str
    phase: str | None = None
    current_motion: str | None = None
    expected_motion: str | None = None
    swing_effect: str | None = None
    shot_outcome: str | None = None


class CreateIssueResponse(BaseModel):
    success: bool
    issue_id: UUID


class IssueProgress(BaseModel):
    """Progress tracking for an analysis issue."""
    completed_sessions: int
    total_successful_reps: int
    overall_success_rate: float | None
    recent_session_success_rates: float | None
    delta: float | None
    last_completed_at: str | None = None


class GetIssue(BaseModel):
    id: UUID
    title: str
    phase: str | None
    description: str | None
    current_motion: str | None
    expected_motion: str | None
    swing_effect: str | None
    shot_outcome: str | None
    created_at: str
    analysis_issue_id: str | None = None
    analysis_id: str | None = None
    confidence: float | None = None
    progress: IssueProgress | None = None
    program_status: str | None = None  # 'active' | 'completed' | None
    source: str = "catalog"  # 'catalog' (admin) | 'custom' (user-authored)

    model_config = ConfigDict(from_attributes=True)
    
    @classmethod
    def from_domain(cls, dto) -> "GetIssue":
        """Convert IssueResponseDTO to GetIssue schema.
        
        Progress data is already included in the DTO if available.
        """
        progress = None
        
        # Convert progress DTO to schema model if present
        if dto.progress:
            progress = IssueProgress(
                completed_sessions=dto.progress.completed_sessions,
                total_successful_reps=dto.progress.total_successful_reps,
                overall_success_rate=dto.progress.overall_success_rate,
                recent_session_success_rates=dto.progress.recent_session_success_rates,
                delta=dto.progress.delta,
                last_completed_at=dto.progress.last_completed_at.isoformat()
                if isinstance(dto.progress.last_completed_at, datetime)
                else dto.progress.last_completed_at,
            )
        
        return cls(
            id=dto.id,
            title=dto.title,
            phase=dto.phase,
            description=dto.description,
            current_motion=dto.current_motion,
            expected_motion=dto.expected_motion,
            swing_effect=dto.swing_effect,
            shot_outcome=dto.shot_outcome,
            created_at=dto.created_at,
            analysis_issue_id=dto.analysis_issue_id,
            analysis_id=dto.analysis_id,
            confidence=dto.confidence,
            progress=progress,
            program_status=getattr(dto, "program_status", None),
            source=getattr(dto, "source", "catalog"),
        )


class UpdateIssueRequest(BaseModel):
    title: str | None = None
    phase: str | None = None
    description: str | None = None
    current_motion: str | None = None
    expected_motion: str | None = None
    swing_effect: str | None = None
    shot_outcome: str | None = None


class BulkDeleteIssuesRequest(BaseModel):
    issue_ids: list[UUID]


# ---------- User-authored issues (coach feedback + browse) ----------

class DraftDrillSchema(BaseModel):
    title: str
    task: str
    success_signal: str
    fault_indicator: str
    ai_filled: list[str] = []


class DraftIssueSchema(BaseModel):
    title: str
    description: str = ""
    phase: str | None = None
    area: str = "FULL_SWING"


class CatalogDrillSchema(BaseModel):
    id: UUID
    title: str
    task: str
    success_signal: str
    fault_indicator: str

    @classmethod
    def from_domain(cls, dto) -> "CatalogDrillSchema":
        return cls(
            id=dto.id,
            title=dto.title,
            task=dto.task,
            success_signal=dto.success_signal,
            fault_indicator=dto.fault_indicator,
        )


class CatalogIssueSchema(BaseModel):
    id: UUID
    title: str
    description: str | None
    phase: str | None
    area: str
    source: str
    drills: list[CatalogDrillSchema] = []

    @classmethod
    def from_domain(cls, dto) -> "CatalogIssueSchema":
        return cls(
            id=dto.id,
            title=dto.title,
            description=dto.description,
            phase=dto.phase,
            area=getattr(dto, "area", "FULL_SWING"),
            source=dto.source,
            drills=[CatalogDrillSchema.from_domain(d) for d in dto.drills],
        )


class StructureFeedbackRequest(BaseModel):
    text: str
    image_base64: str | None = None
    image_mime: str | None = None


class FeedbackDraftResponse(BaseModel):
    issue: DraftIssueSchema
    drills: list[DraftDrillSchema] = []
    similar_issues: list[CatalogIssueSchema] = []

    @classmethod
    def from_domain(cls, dto) -> "FeedbackDraftResponse":
        return cls(
            issue=DraftIssueSchema(
                title=dto.issue.title,
                description=dto.issue.description,
                phase=dto.issue.phase,
                area=getattr(dto.issue, "area", "FULL_SWING"),
            ),
            drills=[
                DraftDrillSchema(
                    title=d.title,
                    task=d.task,
                    success_signal=d.success_signal,
                    fault_indicator=d.fault_indicator,
                    ai_filled=d.ai_filled,
                )
                for d in dto.drills
            ],
            similar_issues=[CatalogIssueSchema.from_domain(i) for i in dto.similar_issues],
        )


class CreateCustomIssueRequest(BaseModel):
    issue: DraftIssueSchema
    drills: list[DraftDrillSchema] = []