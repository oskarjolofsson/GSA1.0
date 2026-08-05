from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Any


class GenerateProgramRequest(BaseModel):
    # Exactly one of these identifies what to groove: analysis_issue_id (AI path)
    # or issue_id (coach/browse path).
    analysis_issue_id: UUID | None = None
    issue_id: UUID | None = None


class DrillGrade(BaseModel):
    """How one drill block went. Send exactly one of `grade` or `metric_value`.

    A feel drill sends `grade` -- the golfer's tap is the measurement. A scored drill sends
    `metric_value`, the raw number, and the server grades it against the drill's current
    thresholds. Clients never compute a grade from a metric: `grade_at` is admin-editable,
    so a build that shipped before a retune would grade on numbers nobody can see any more.
    """
    drill_id: UUID
    grade: str | None = None  # 'rough' | 'ok' | 'dialed'
    metric_value: float | None = None


class CompleteStepRequest(BaseModel):
    practice_session_id: UUID | None = None
    grades: list[DrillGrade] = []


class StepDrillResponse(BaseModel):
    id: UUID
    title: str

    model_config = ConfigDict(from_attributes=True)


class ProgramStepResponse(BaseModel):
    id: UUID
    program_id: UUID
    order_index: int
    session_type: str
    prescription: dict[str, Any]
    status: str
    practice_session_id: UUID | None
    drills: list[StepDrillResponse] = []

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_domain(cls, dto) -> "ProgramStepResponse":
        return cls(
            id=dto.id,
            program_id=dto.program_id,
            order_index=dto.order_index,
            session_type=dto.session_type,
            prescription=dto.prescription,
            status=dto.status,
            practice_session_id=dto.practice_session_id,
            drills=[StepDrillResponse(id=d.id, title=d.title) for d in dto.drills],
        )


class ProgramResponse(BaseModel):
    id: UUID
    user_id: UUID
    analysis_issue_id: UUID | None
    issue_id: UUID | None
    title: str
    status: str
    created_at: datetime
    grooved_count: int
    total_drills: int
    # Which part of the game, and which of the two per-area slots this program holds.
    area: str | None = None
    slot: int = 0
    steps: list[ProgramStepResponse]

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_domain(cls, dto) -> "ProgramResponse":
        return cls(
            id=dto.id,
            user_id=dto.user_id,
            analysis_issue_id=dto.analysis_issue_id,
            issue_id=dto.issue_id,
            title=dto.title,
            status=dto.status,
            created_at=dto.created_at,
            grooved_count=dto.grooved_count,
            total_drills=dto.total_drills,
            area=dto.area,
            slot=dto.slot,
            steps=[ProgramStepResponse.from_domain(s) for s in dto.steps],
        )


class ProgramSummaryResponse(BaseModel):
    """One program as it appears in the list of everything the golfer has open.

    Carries `next_step` inline so rendering the whole slate is a single request, and omits
    `steps` because nothing displays a program's full history there -- sending it would
    grow the payload with every session completed.
    """
    id: UUID
    user_id: UUID
    analysis_issue_id: UUID | None
    issue_id: UUID | None
    title: str
    status: str
    created_at: datetime
    grooved_count: int
    total_drills: int
    area: str | None = None
    slot: int = 0
    next_step: ProgramStepResponse | None = None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_domain(cls, dto) -> "ProgramSummaryResponse":
        return cls(
            id=dto.id,
            user_id=dto.user_id,
            analysis_issue_id=dto.analysis_issue_id,
            issue_id=dto.issue_id,
            title=dto.title,
            status=dto.status,
            created_at=dto.created_at,
            grooved_count=dto.grooved_count,
            total_drills=dto.total_drills,
            area=dto.area,
            slot=dto.slot,
            next_step=(
                ProgramStepResponse.from_domain(dto.next_step) if dto.next_step else None
            ),
        )


class StepAdvanceResponse(BaseModel):
    completed_step: ProgramStepResponse
    next_step: ProgramStepResponse | None
    program_status: str
    grooved_count: int
    total_drills: int

    @classmethod
    def from_domain(cls, dto) -> "StepAdvanceResponse":
        return cls(
            completed_step=ProgramStepResponse.from_domain(dto.completed_step),
            next_step=ProgramStepResponse.from_domain(dto.next_step) if dto.next_step else None,
            program_status=dto.program_status,
            grooved_count=dto.grooved_count,
            total_drills=dto.total_drills,
        )
