from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from core.services.dtos.analysis_v2_dto import (
    AnalysisDetailsDTO,
    AnalysisDrillDTO,
    AnalysisIssueDetailDTO,
    AnalysisStatusDTO,
)


class CreateAnalysisRequest(BaseModel):
    """What the golfer tells us before uploading. Keys come from /taxonomy/.

    `miss` must belong to `area`. `club_type` and `camera_view` are optional: areas other
    than full swing may not ask for them.
    """

    area: str
    miss: str
    notes: str | None = None
    club_type: str | None = None
    camera_view: str | None = None


class CreateAnalysisResponse(BaseModel):
    analysis_id: UUID
    upload_url: str


class AnalysisStatusResponse(BaseModel):
    """What the client polls. `error_message` is set once status is `failed`."""

    analysis_id: UUID
    status: str
    error_message: str | None = None

    @classmethod
    def from_dto(cls, dto: AnalysisStatusDTO) -> "AnalysisStatusResponse":
        return cls(analysis_id=dto.analysis_id, status=dto.status, error_message=dto.error_message)


class AnalysisDrill(BaseModel):
    drill_id: UUID
    title: str
    task: str
    success_signal: str
    fault_indicator: str

    @classmethod
    def from_dto(cls, dto: AnalysisDrillDTO) -> "AnalysisDrill":
        return cls(
            drill_id=dto.drill_id,
            title=dto.title,
            task=dto.task,
            success_signal=dto.success_signal,
            fault_indicator=dto.fault_indicator,
        )


class AnalysisIssueDetail(BaseModel):
    analysis_issue_id: UUID
    issue_id: UUID
    title: str
    description: str
    layman_title: str | None = None
    layman_desc: str | None = None
    confidence: float | None = None
    drills: list[AnalysisDrill]

    @classmethod
    def from_dto(cls, dto: AnalysisIssueDetailDTO) -> "AnalysisIssueDetail":
        return cls(
            analysis_issue_id=dto.analysis_issue_id,
            issue_id=dto.issue_id,
            title=dto.title,
            description=dto.description,
            layman_title=dto.layman_title,
            layman_desc=dto.layman_desc,
            confidence=dto.confidence,
            drills=[AnalysisDrill.from_dto(d) for d in dto.drills],
        )


class AnalysisDetailsResponse(BaseModel):
    """A completed analysis. `area`, `miss` and `law` are taxonomy keys; the labels come
    from /taxonomy/. Issues are highest confidence first and may be empty."""

    analysis_id: UUID
    video_id: UUID | None
    thumbnail_url: str | None = None
    status: str
    area: str | None
    miss: str | None
    notes: str | None
    club_type: str | None
    camera_view: str | None
    law: str | None
    issues: list[AnalysisIssueDetail]
    created_at: datetime
    completed_at: datetime | None

    @classmethod
    def from_dto(cls, dto: AnalysisDetailsDTO, thumbnail_url: str | None = None) -> "AnalysisDetailsResponse":
        return cls(
            analysis_id=dto.analysis_id,
            video_id=dto.video_id,
            thumbnail_url=thumbnail_url,
            status=dto.status,
            area=dto.area,
            miss=dto.miss,
            notes=dto.notes,
            club_type=dto.club_type,
            camera_view=dto.camera_view,
            law=dto.law,
            issues=[AnalysisIssueDetail.from_dto(i) for i in dto.issues],
            created_at=dto.created_at,
            completed_at=dto.completed_at,
        )
