from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import date, datetime


class ActivityCount(BaseModel):
    """One contribution-graph square."""
    occurred_on: date
    count: int

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_domain(cls, dto) -> "ActivityCount":
        return cls(occurred_on=dto.occurred_on, count=dto.count)


class ActivityDrillRun(BaseModel):
    id: UUID
    # Nulled rather than cascaded when a drill is deleted, so the run survives it.
    drill_id: UUID | None = None
    drill_title: str
    # FROZEN. This column held a feel ordinal, never a rep count; `feel` replaces it.
    # Still sent because builds shipped before that split read it.
    successful_reps: int
    failed_reps: int
    skipped: bool
    started_at: datetime
    completed_at: datetime | None
    feel: int | None = None
    metric_value: float | None = None
    metric_type: str | None = None
    grade: str | None = None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_domain(cls, dto) -> "ActivityDrillRun":
        return cls(
            id=dto.id,
            drill_id=dto.drill_id,
            drill_title=dto.drill_title,
            successful_reps=dto.successful_reps,
            failed_reps=dto.failed_reps,
            skipped=dto.skipped,
            started_at=dto.started_at,
            completed_at=dto.completed_at,
            feel=dto.feel,
            metric_value=dto.metric_value,
            metric_type=dto.metric_type,
            grade=dto.grade,
        )


class ActivitySession(BaseModel):
    id: UUID
    status: str
    started_at: datetime
    completed_at: datetime | None
    analysis_issue_id: UUID | None
    drill_runs: list[ActivityDrillRun]

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_domain(cls, dto) -> "ActivitySession":
        return cls(
            id=dto.id,
            status=dto.status,
            started_at=dto.started_at,
            completed_at=dto.completed_at,
            analysis_issue_id=dto.analysis_issue_id,
            drill_runs=[ActivityDrillRun.from_domain(run) for run in dto.drill_runs],
        )


class ActivityAnalysis(BaseModel):
    id: UUID
    status: str
    created_at: datetime
    completed_at: datetime | None
    thumbnail_url: str | None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_domain(cls, dto) -> "ActivityAnalysis":
        return cls(
            id=dto.id,
            status=dto.status,
            created_at=dto.created_at,
            completed_at=dto.completed_at,
            thumbnail_url=dto.thumbnail_url,
        )


class ActivityDayDetail(BaseModel):
    date: date
    sessions: list[ActivitySession]
    analyses: list[ActivityAnalysis]

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_domain(cls, dto) -> "ActivityDayDetail":
        return cls(
            date=dto.date,
            sessions=[ActivitySession.from_domain(s) for s in dto.sessions],
            analyses=[ActivityAnalysis.from_domain(a) for a in dto.analyses],
        )
