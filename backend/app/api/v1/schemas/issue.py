from pydantic import BaseModel, ConfigDict
from uuid import UUID


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

    model_config = ConfigDict(from_attributes=True)
    
    @classmethod
    def from_domain(cls, dto) -> "GetIssue":
        """Convert IssueResponseDTO to GetIssue schema."""
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