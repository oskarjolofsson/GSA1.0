from ..models.Program import Program
from ..models.ProgramStep import ProgramStep
from ..models.ProgramDrillState import ProgramDrillState
from sqlalchemy.orm import Session
from uuid import UUID


# ---------------- PROGRAMS ----------------

def create_program(program: Program, session: Session) -> Program:
    session.add(program)
    session.flush()
    return program


def get_program_by_id(program_id: UUID, session: Session) -> Program | None:
    return session.get(Program, program_id)


def get_active_program_for_issue(
    user_id: UUID, analysis_issue_id: UUID, session: Session
) -> Program | None:
    return (
        session.query(Program)
        .filter(
            Program.user_id == user_id,
            Program.analysis_issue_id == analysis_issue_id,
            Program.status == "active",
        )
        .order_by(Program.created_at.desc())
        .first()
    )


def get_active_program_for_issue_id(
    user_id: UUID, issue_id: UUID, session: Session
) -> Program | None:
    return (
        session.query(Program)
        .filter(
            Program.user_id == user_id,
            Program.issue_id == issue_id,
            Program.status == "active",
        )
        .order_by(Program.created_at.desc())
        .first()
    )


def get_active_programs_by_user(user_id: UUID, session: Session) -> list[Program]:
    return (
        session.query(Program)
        .filter(Program.user_id == user_id, Program.status == "active")
        .order_by(Program.created_at.desc())
        .all()
    )


def get_active_programs_by_area(user_id: UUID, area: str, session: Session) -> list[Program]:
    """The user's active programs in one area — at most two, by the partial unique index
    programs_one_active_per_area_slot. Read to find the free slot before seeding."""
    return (
        session.query(Program)
        .filter(
            Program.user_id == user_id,
            Program.area == area,
            Program.status == "active",
        )
        .order_by(Program.created_at)
        .all()
    )


def get_programs_by_user(user_id: UUID, session: Session) -> list[Program]:
    """All of the user's programs (any status), for annotating issues with their
    program state."""
    return (
        session.query(Program)
        .filter(Program.user_id == user_id)
        .order_by(Program.created_at.desc())
        .all()
    )


def get_programs_for_issue(user_id: UUID, issue_id: UUID, session: Session) -> list[Program]:
    """All of the user's programs (any status) for one issue — used to remove a focus."""
    return (
        session.query(Program)
        .filter(Program.user_id == user_id, Program.issue_id == issue_id)
        .all()
    )


def delete_program(program: Program, session: Session) -> None:
    """Delete a program; its steps and drill states cascade. Practice sessions are not
    touched — they carry their own `area` and are never owned by a program, so the
    contribution graph keeps every session the golfer actually did."""
    session.delete(program)
    session.flush()


def update_program(program: Program, session: Session) -> Program:
    session.add(program)
    session.flush()
    return program


# ---------------- PROGRAM STEPS ----------------

def create_steps(steps: list[ProgramStep], session: Session) -> list[ProgramStep]:
    session.add_all(steps)
    session.flush()
    return steps


def get_step_by_id(step_id: UUID, session: Session) -> ProgramStep | None:
    return session.get(ProgramStep, step_id)


def get_steps_by_program_id(program_id: UUID, session: Session) -> list[ProgramStep]:
    return (
        session.query(ProgramStep)
        .filter(ProgramStep.program_id == program_id)
        .order_by(ProgramStep.order_index)
        .all()
    )


def get_pending_step(program_id: UUID, session: Session) -> ProgramStep | None:
    return (
        session.query(ProgramStep)
        .filter(ProgramStep.program_id == program_id, ProgramStep.status == "pending")
        .order_by(ProgramStep.order_index)
        .first()
    )


def get_pending_steps_by_program_ids(
    program_ids: list[UUID], session: Session
) -> list[ProgramStep]:
    """Pending steps across many programs in one query.

    The list endpoint renders every active program (up to two per area) on each Home
    render. Fetching each program's step individually is an N+1 that grows with a number
    the golfer controls, so it is batched here — same reasoning as the batched drill
    lookup in program_service._apply_grades."""
    if not program_ids:
        return []
    return (
        session.query(ProgramStep)
        .filter(
            ProgramStep.program_id.in_(program_ids),
            ProgramStep.status == "pending",
        )
        .order_by(ProgramStep.order_index)
        .all()
    )


def get_completed_steps(program_id: UUID, session: Session) -> list[ProgramStep]:
    return (
        session.query(ProgramStep)
        .filter(ProgramStep.program_id == program_id, ProgramStep.status == "completed")
        .order_by(ProgramStep.order_index)
        .all()
    )


def create_step(step: ProgramStep, session: Session) -> ProgramStep:
    session.add(step)
    session.flush()
    return step


def update_step(step: ProgramStep, session: Session) -> ProgramStep:
    session.add(step)
    session.flush()
    return step


# ---------------- PROGRAM DRILL STATES (spaced repetition) ----------------

def create_drill_states(states: list[ProgramDrillState], session: Session) -> list[ProgramDrillState]:
    session.add_all(states)
    session.flush()
    return states


def get_drill_states_by_program_id(program_id: UUID, session: Session) -> list[ProgramDrillState]:
    return (
        session.query(ProgramDrillState)
        .filter(ProgramDrillState.program_id == program_id)
        .all()
    )


def get_drill_states_by_program_ids(
    program_ids: list[UUID], session: Session
) -> list[ProgramDrillState]:
    """Drill states across many programs in one query, for batched groove counts."""
    if not program_ids:
        return []
    return (
        session.query(ProgramDrillState)
        .filter(ProgramDrillState.program_id.in_(program_ids))
        .all()
    )


def update_drill_state(state: ProgramDrillState, session: Session) -> ProgramDrillState:
    session.add(state)
    session.flush()
    return state
