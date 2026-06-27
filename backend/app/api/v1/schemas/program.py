from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Any


class GenerateProgramRequest(BaseModel):
    analysis_issue_id: UUID


class CompleteStepRequest(BaseModel):
    practice_session_id: UUID | None = None


class ProgramStepResponse(BaseModel):
    id: UUID
    program_id: UUID
    order_index: int
    session_type: str
    prescription: dict[str, Any]
    status: str
    practice_session_id: UUID | None

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
        )


class ProgramResponse(BaseModel):
    id: UUID
    user_id: UUID
    analysis_issue_id: UUID | None
    title: str
    status: str
    created_at: datetime
    completed_steps: int
    total_steps: int
    steps: list[ProgramStepResponse]

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_domain(cls, dto) -> "ProgramResponse":
        return cls(
            id=dto.id,
            user_id=dto.user_id,
            analysis_issue_id=dto.analysis_issue_id,
            title=dto.title,
            status=dto.status,
            created_at=dto.created_at,
            completed_steps=dto.completed_steps,
            total_steps=dto.total_steps,
            steps=[ProgramStepResponse.from_domain(s) for s in dto.steps],
        )


class StepAdvanceResponse(BaseModel):
    completed_step: ProgramStepResponse
    next_step: ProgramStepResponse | None
    program_status: str

    @classmethod
    def from_domain(cls, dto) -> "StepAdvanceResponse":
        return cls(
            completed_step=ProgramStepResponse.from_domain(dto.completed_step),
            next_step=ProgramStepResponse.from_domain(dto.next_step) if dto.next_step else None,
            program_status=dto.program_status,
        )
