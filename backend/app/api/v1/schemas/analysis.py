from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime, timedelta


class CreateAnalysisRequest(BaseModel):
    user_id: UUID
    model: str
    start_time: float
    end_time: float
    prompt_shape: str | None = None
    prompt_height: str | None = None
    prompt_misses: str | None = None
    prompt_extra: str | None = None


class CreateAnalysisResponse(BaseModel):
    success: bool
    analysis_id: UUID
    upload_url: str


class GetAnalysis(BaseModel):
    analysis_id: UUID
    user_id: UUID
    video_id: UUID
    
    model_version: str
    status: str
    success: bool | None
    error_message: str | None
    
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
    
    @classmethod
    def from_domain(cls, dto) -> "GetAnalysis":
        """Convert GetAnalaysisDTO to GetAnalysis schema."""
        return cls(
            analysis_id=dto.analysis_id,
            user_id=dto.user_id,
            video_id=dto.video_id,
            model_version=dto.model_version,
            status=dto.status,
            success=dto.success,
            error_message=dto.error_message,
            created_at=dto.created_at,
            started_at=dto.started_at,
            completed_at=dto.completed_at,
        )
    
    
class GetAnalysisIssue(BaseModel):
    analysis_issue_id: UUID
    analysis_id: UUID
    
    issue_id: UUID
    confidence: float
    
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
    
    @classmethod
    def from_domain(cls, dto) -> "GetAnalysisIssue":
        """Convert GetAnalaysisIssueDTO to GetAnalysisIssue schema."""
        return cls(
            analysis_issue_id=dto.analysis_issue_id,
            analysis_id=dto.analysis_id,
            issue_id=dto.issue_id,
            confidence=dto.confidence,
            created_at=dto.created_at,
        )