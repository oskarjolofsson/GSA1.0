from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime


class CreateIssueRequest(BaseModel):
    title: str
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
    last_completed_at: str | None = None


class GetIssue(BaseModel):
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
    progress: IssueProgress | None = None

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
                last_completed_at=dto.progress.last_completed_at.isoformat()
                if isinstance(dto.progress.last_completed_at, datetime)
                else dto.progress.last_completed_at,
            )
        
        return cls(
            id=dto.id,
            title=dto.title,
            phase=dto.phase,
            current_motion=dto.current_motion,
            expected_motion=dto.expected_motion,
            swing_effect=dto.swing_effect,
            shot_outcome=dto.shot_outcome,
            created_at=dto.created_at,
            analysis_issue_id=dto.analysis_issue_id,
            analysis_id=dto.analysis_id,
            confidence=dto.confidence,
            progress=progress,
        )


class UpdateIssueRequest(BaseModel):
    title: str | None = None
    phase: str | None = None
    current_motion: str | None = None
    expected_motion: str | None = None
    swing_effect: str | None = None
    shot_outcome: str | None = None


class BulkDeleteIssuesRequest(BaseModel):
    issue_ids: list[UUID]