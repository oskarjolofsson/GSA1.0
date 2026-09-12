from ..models.Program import Program
from ..models.ProgramStep import ProgramStep
from ..models.ProgramDrillState import ProgramDrillState
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from uuid import UUID


# T13 audit (subscription model rework, HOLD SCOPE review): every query in this file and
# in core/services/program_service.py that filters Program by status already uses an
# explicit allowlist (`Program.status == "active"`, `ProgramStep.status == "pending"`,
# `ProgramStep.status == "completed"`), never a denylist (`!= "completed"` etc). Confirmed
# by grep across both files before Lane B's migration adds "inactive" to the status CHECK
# constraint, so old code cannot silently start treating an inactive Program as active (or
# vice versa) once that value exists. `get_programs_by_user` and `get_programs_for_issue`
# intentionally filter by status not at all ("any status") -- that is correct as-is, not a
# denylist bug, since both are used to look across every program a user has ever had.
# No changes were needed here for T13.


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


def acquire_user_focus_lock(user_id: UUID, session: Session) -> None:
    """Transaction-scoped advisory lock keyed on the user.

    Used by program_service._enforce_free_tier_focus_cap before it counts active
    programs: a plain `SELECT ... FOR UPDATE` cannot serialize two concurrent callers
    when the user holds zero active programs, because there is no row yet to lock. This
    lock closes that gap regardless of row count. Released automatically at
    commit/rollback (xact-scoped), so it needs no matching "release" call.
    """
    session.execute(text("SELECT pg_advisory_xact_lock(hashtext(:user_id))"), {"user_id": str(user_id)})


def lock_active_program_ids_for_user(user_id: UUID, session: Session) -> list[UUID]:
    """The user's active Program ids, locked FOR UPDATE inside the caller's transaction.

    Paired with `acquire_user_focus_lock`: once that lock serializes callers for this
    user, this read (and the count the caller derives from it) is authoritative for the
    rest of the transaction -- see program_service._enforce_free_tier_focus_cap (T2).
    """
    stmt = (
        select(Program.id)
        .where(Program.user_id == user_id, Program.status == "active")
        .with_for_update()
    )
    return list(session.execute(stmt).scalars().all())


def try_add_program(fields: dict, session: Session) -> Program | None:
    """Insert a program, or return None if a unique index refused it.

    The (user, area, slot) index is the authority on how many focuses a golfer may hold,
    and it can refuse an insert whose slot was free when the caller looked. Returning
    None rather than letting IntegrityError escape keeps `sqlalchemy.exc` in this layer;
    the caller decides what to tell the golfer.
    """
    program = Program(**fields)
    try:
        return create_program(program, session)
    except IntegrityError:
        session.rollback()
        return None


def add_drill_states(
    program_id: UUID, drill_ids: list[UUID], session: Session
) -> list[ProgramDrillState]:
    """Seed a program's per-drill strengths at zero."""
    states = [
        ProgramDrillState(program_id=program_id, drill_id=drill_id, strength=0)
        for drill_id in drill_ids
    ]
    return create_drill_states(states, session) if states else []


def add_step(fields: dict, session: Session) -> ProgramStep:
    """Insert a scheduled step from already-resolved fields."""
    return create_step(ProgramStep(**fields), session)
