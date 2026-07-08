from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from sqlalchemy.orm import Session

from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.entitlement import require_premium

from app.api.v1.schemas.program import (
    GenerateProgramRequest,
    CompleteStepRequest,
    ProgramResponse,
    ProgramStepResponse,
    StepAdvanceResponse,
)

from core.services import program_service
from core.services.dtos.program_service_dto import DrillGradeDTO

router = APIRouter()


@router.post("/generate/", response_model=ProgramResponse, status_code=201)
def generate_program(
    request: GenerateProgramRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_premium),
):
    """
    Generate (or return the existing) active program.

    Accepts either analysis_issue_id (AI path) or issue_id (coach/browse path).
    Idempotent: re-calling with the same issue returns the active program rather
    than creating a duplicate.
    """
    if request.analysis_issue_id is not None:
        result = program_service.generate_program_for_issue(
            user_id=current_user["user_id"],
            analysis_issue_id=request.analysis_issue_id,
            session=db,
        )
    elif request.issue_id is not None:
        result = program_service.generate_program_from_issue(
            user_id=current_user["user_id"],
            issue_id=request.issue_id,
            session=db,
        )
    else:
        raise HTTPException(
            status_code=422,
            detail="Provide either analysis_issue_id or issue_id.",
        )
    return ProgramResponse.from_domain(result)


@router.get("/active/", response_model=ProgramResponse | None)
def get_active_program(
    analysis_issue_id: UUID | None = None,
    issue_id: UUID | None = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Get the current user's active program for the given analysis_issue_id or
    issue_id, or their most recent active program if neither is specified.
    Returns null if none.
    """
    result = program_service.get_active_program(
        user_id=current_user["user_id"],
        analysis_issue_id=analysis_issue_id,
        session=db,
        issue_id=issue_id,
    )
    return ProgramResponse.from_domain(result) if result else None


@router.get("/{program_id}/", response_model=ProgramResponse)
def get_program(
    program_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get a program (with its steps) by id."""
    result = program_service.get_program(
        program_id=program_id,
        user_id=current_user["user_id"],
        session=db,
    )
    return ProgramResponse.from_domain(result)


@router.get("/{program_id}/next-step/", response_model=ProgramStepResponse | None)
def get_next_step(
    program_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get the next pending step in the program, or null if the program is done."""
    result = program_service.get_next_step(
        program_id=program_id,
        user_id=current_user["user_id"],
        session=db,
    )
    return ProgramStepResponse.from_domain(result) if result else None


@router.post("/{program_id}/steps/{step_id}/complete/", response_model=StepAdvanceResponse)
def complete_step(
    program_id: UUID,
    step_id: UUID,
    request: CompleteStepRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Mark a program step completed, optionally linking the practice session that
    fulfilled it and passing per-drill block-feel grades (rough/ok/dialed). Grades
    update the spaced-repetition state that schedules future range sessions.
    """
    grades = [DrillGradeDTO(drill_id=g.drill_id, grade=g.grade) for g in request.grades]
    result = program_service.complete_step(
        program_id=program_id,
        step_id=step_id,
        user_id=current_user["user_id"],
        grades=grades,
        practice_session_id=request.practice_session_id,
        session=db,
    )
    return StepAdvanceResponse.from_domain(result)
