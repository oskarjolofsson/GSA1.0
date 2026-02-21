from dataclasses import dataclass
from uuid import UUID
from datetime import datetime


@dataclass(frozen=True)
class RunAnalysisDTO:
    user_id : UUID
    analysis_id : int
    
    
@dataclass(frozen=True)
class CreateAnalysisDTO:
    start_time: float
    end_time: float
    
    user_id: UUID
    
    model: str
    
    prompt_shape: str | None = None
    prompt_height: str | None = None
    prompt_misses: str | None = None
    prompt_extra: str | None = None
    
    
@dataclass(frozen=True)
class AnalysisResponseDTO:
    issues: list[dict]
    club_type: str
    camera_view: str
    
@dataclass(frozen=True)    
class GetAnalaysisDTO:
    analysis_id: UUID
    user_id: UUID
    video_id: UUID
    
    model_version: str
    status: str
    success: bool | None
    error_message: str | None
    
    created_at: datetime
    started_at: datetime
    completed_at: datetime
    
@dataclass(frozen=True)
class GetAnalaysisIssueDTO:
    analysis_issue_id: UUID
    analysis_id: UUID
    
    issue_id: UUID
    confidence: float
    
    created_at: datetime
