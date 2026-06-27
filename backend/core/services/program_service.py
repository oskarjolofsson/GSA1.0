from core.infrastructure.db import models
from core.infrastructure.db.repositories import programs as repo
from core.infrastructure.db.repositories import drills as drill_repo
from core.infrastructure.db.repositories import analysis_issues as analysis_issue_repo
from core.services import exceptions
from core.services.dtos.program_service_dto import (
    ProgramDTO,
    ProgramStepDTO,
    StepAdvanceDTO,
)

from sqlalchemy.orm import Session
from uuid import UUID


# =========== PROGRAM TEMPLATE ============
#
# A program is a finite, ordered sequence of prescribed sessions. Phases are
# measured in sessions completed (not weeks) and blend range work with on-course
# play to drive range->course transfer. A re-test step is interleaved after every
# RETEST_CADENCE work sessions (and always closes the program) so the player can
# film the same issue and self-compare over time.

RETEST_CADENCE = 4

# Ordered work sessions: (session_type, drill_count). drill_count is ignored for
# non-range types.
WORK_PATTERN: list[tuple[str, int]] = [
    ("range", 1),
    ("play", 0),
    ("range", 2),
    ("play", 0),
    ("range", 2),
    ("play", 0),
]

PLAY_HOLES_DEFAULT = 9
PLAY_FOCUS_DEFAULT = "Hold one swing thought on every full shot."
RETEST_INSTRUCTION = "Film one swing of this issue so you can compare it to where you started."


# =========== PUBLIC API ============

def generate_program_for_issue(user_id: UUID, analysis_issue_id: UUID, session: Session) -> ProgramDTO:
    """Create an active program for the given analysis issue. Idempotent: if an
    active program already exists for this issue, return it instead of creating a
    duplicate."""
    existing = repo.get_active_program_for_issue(user_id, analysis_issue_id, session)
    if existing:
        return _program_to_dto(existing)

    analysis_issue = analysis_issue_repo.get_analysis_issue_by_id(analysis_issue_id, session)
    if not analysis_issue:
        raise exceptions.NotFoundException("AnalysisIssue", str(analysis_issue_id))

    if analysis_issue.analysis is None or str(analysis_issue.analysis.user_id) != str(user_id):
        raise exceptions.ForbiddenException("You do not have access to this analysis issue.")

    drills = drill_repo.get_drills_by_issue_id(analysis_issue.issue_id, session)
    issue_title = analysis_issue.issue.title if analysis_issue.issue else "your swing issue"

    program = models.Program(
        user_id=user_id,
        analysis_issue_id=analysis_issue_id,
        title=f"Fix {issue_title}",
        status="active",
    )
    repo.create_program(program, session)

    steps = _build_steps(program.id, drills)
    repo.create_steps(steps, session)

    return _program_to_dto(program, steps)


def get_active_program(user_id: UUID, analysis_issue_id: UUID | None, session: Session) -> ProgramDTO | None:
    """Return the user's active program for a given issue, or their most recent
    active program if no issue is specified. None if there is none."""
    if analysis_issue_id is not None:
        program = repo.get_active_program_for_issue(user_id, analysis_issue_id, session)
    else:
        active = repo.get_active_programs_by_user(user_id, session)
        program = active[0] if active else None

    return _program_to_dto(program) if program else None


def get_program(program_id: UUID, user_id: UUID, session: Session) -> ProgramDTO:
    program = repo.get_program_by_id(program_id, session)
    _verify_owner(program, program_id, user_id)
    return _program_to_dto(program)


def get_next_step(program_id: UUID, user_id: UUID, session: Session) -> ProgramStepDTO | None:
    program = repo.get_program_by_id(program_id, session)
    _verify_owner(program, program_id, user_id)
    step = repo.get_next_pending_step(program_id, session)
    return _step_to_dto(step) if step else None


def complete_step(
    program_id: UUID,
    step_id: UUID,
    user_id: UUID,
    practice_session_id: UUID | None,
    session: Session,
) -> StepAdvanceDTO:
    """Mark a step completed, link the practice session that fulfilled it, advance
    to the next step, and complete the program when no pending steps remain."""
    program = repo.get_program_by_id(program_id, session)
    _verify_owner(program, program_id, user_id)

    step = repo.get_step_by_id(step_id, session)
    if not step or step.program_id != program_id:
        raise exceptions.NotFoundException("ProgramStep", str(step_id))

    if step.status != "completed":
        step.status = "completed"
    if practice_session_id is not None:
        step.practice_session_id = practice_session_id
    repo.update_step(step, session)

    next_step = repo.get_next_pending_step(program_id, session)
    if next_step is None and program.status == "active":
        program.status = "completed"
        repo.update_program(program, session)

    return StepAdvanceDTO(
        completed_step=_step_to_dto(step),
        next_step=_step_to_dto(next_step) if next_step else None,
        program_status=program.status,
    )


# =========== GENERATION HELPERS ============

def _build_steps(program_id: UUID, drills: list[models.Drill]) -> list[models.ProgramStep]:
    specs = _build_step_specs()
    steps: list[models.ProgramStep] = []
    drill_cursor = 0

    for order_index, (session_type, drill_count) in enumerate(specs):
        if session_type == "range":
            assigned, drill_cursor = _take_drills(drills, drill_cursor, drill_count)
            prescription = {
                "drill_ids": [str(d.id) for d in assigned],
                "num_blocks": drill_count,
                "cue": None,
            }
        elif session_type == "play":
            prescription = {"holes": PLAY_HOLES_DEFAULT, "focus": PLAY_FOCUS_DEFAULT}
        else:  # retest
            prescription = {"instruction": RETEST_INSTRUCTION}

        steps.append(
            models.ProgramStep(
                program_id=program_id,
                order_index=order_index,
                session_type=session_type,
                prescription=prescription,
                status="pending",
            )
        )

    return steps


def _build_step_specs() -> list[tuple[str, int]]:
    """Materialize WORK_PATTERN into a step spec list, interleaving a retest after
    every RETEST_CADENCE work sessions and always closing with one."""
    specs: list[tuple[str, int]] = []
    work_count = 0
    for spec in WORK_PATTERN:
        specs.append(spec)
        work_count += 1
        if work_count % RETEST_CADENCE == 0:
            specs.append(("retest", 0))

    if not specs or specs[-1][0] != "retest":
        specs.append(("retest", 0))

    return specs


def _take_drills(
    drills: list[models.Drill], cursor: int, count: int
) -> tuple[list[models.Drill], int]:
    """Take `count` drills starting at `cursor`, cycling through the available
    drills so different range steps emphasize different drills. Returns the picked
    drills and the advanced cursor."""
    if not drills or count <= 0:
        return [], cursor
    picked = [drills[(cursor + i) % len(drills)] for i in range(count)]
    return picked, cursor + count


# =========== DTO HELPERS ============

def _verify_owner(program: models.Program | None, program_id: UUID, user_id: UUID) -> None:
    if program is None:
        raise exceptions.NotFoundException("Program", str(program_id))
    if str(program.user_id) != str(user_id):
        raise exceptions.ForbiddenException("You do not have access to this program.")


def _program_to_dto(program: models.Program, steps: list[models.ProgramStep] | None = None) -> ProgramDTO:
    step_models = steps if steps is not None else list(program.steps)
    step_dtos = [_step_to_dto(s) for s in step_models]
    completed = sum(1 for s in step_models if s.status == "completed")
    return ProgramDTO(
        id=program.id,
        user_id=program.user_id,
        analysis_issue_id=program.analysis_issue_id,
        title=program.title,
        status=program.status,
        created_at=program.created_at,
        completed_steps=completed,
        total_steps=len(step_models),
        steps=step_dtos,
    )


def _step_to_dto(step: models.ProgramStep) -> ProgramStepDTO:
    return ProgramStepDTO(
        id=step.id,
        program_id=step.program_id,
        order_index=step.order_index,
        session_type=step.session_type,
        prescription=step.prescription or {},
        status=step.status,
        practice_session_id=step.practice_session_id,
    )
