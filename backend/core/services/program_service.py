from core.infrastructure.db import models
from core.infrastructure.db.repositories import programs as repo
from core.infrastructure.db.repositories import drills as drill_repo
from core.infrastructure.db.repositories import analysis_issues as analysis_issue_repo
from core.infrastructure.db.repositories import issues as issue_repo
from core.services import exceptions
from core.services.dtos.program_service_dto import (
    ProgramDTO,
    ProgramStepDTO,
    StepDrillDTO,
    StepAdvanceDTO,
    DrillGradeDTO,
)

from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime, timezone


# =========== TUNING CONSTANTS ============
#
# Open-ended, self-scheduling program driven by the golfer's own block-feel
# (Rough/OK/Dialed). AI stays backstage. The schedule concentrates range time on
# the drills that still feel rough; grooved drills fade out.

STRENGTH_MAX = 5
GROOVED_THRESHOLD = 3          # strength >= this => the drill is "grooved"
NUM_DRILLS_PER_RANGE = 2       # how many drills fill a range session
RETEST_CADENCE = 6             # insert a retest after this many work sessions

# The repeating work rhythm; a retest is interleaved by RETEST_CADENCE.
WORK_CYCLE: list[str] = ["range", "range", "play"]

# Lightweight spaced repetition: how a grade moves a drill's strength.
GRADE_STRENGTH_DELTA: dict[str, int] = {"rough": -1, "ok": 0, "dialed": 1}

PLAY_HOLES_DEFAULT = 9
PLAY_FOCUS_DEFAULT = "Hold one swing thought on every full shot."
RETEST_INSTRUCTION = "Film one swing of this issue so you can compare it to where you started."
# Custom (coach/browse) issues have no source analysis to re-run, so the retest is
# a pure self-comparison of the golfer's own footage with no AI reference read.
RETEST_INSTRUCTION_SELF = "Film one swing of this issue and compare it side by side with your first clip."

_EPOCH = datetime(1970, 1, 1, tzinfo=timezone.utc)


# =========== PUBLIC API ============

def generate_program_for_issue(user_id: UUID, analysis_issue_id: UUID, session: Session) -> ProgramDTO:
    """AI path: create an active program from an analysis issue. Idempotent:
    returns the existing active program for this analysis issue if there is one.
    Keeps analysis_issue_id as provenance and seeds the program from the
    underlying issue's drills. Steps are scheduled on demand, not pre-generated."""
    existing = repo.get_active_program_for_issue(user_id, analysis_issue_id, session)
    if existing:
        return _program_to_dto(existing, session)

    analysis_issue = analysis_issue_repo.get_analysis_issue_by_id(analysis_issue_id, session)
    if not analysis_issue:
        raise exceptions.NotFoundException("AnalysisIssue", str(analysis_issue_id))

    if analysis_issue.analysis is None or str(analysis_issue.analysis.user_id) != str(user_id):
        raise exceptions.ForbiddenException("You do not have access to this analysis issue.")

    issue_title = analysis_issue.issue.title if analysis_issue.issue else "your swing issue"
    return _seed_program(
        user_id=user_id,
        issue_id=analysis_issue.issue_id,
        title=f"Fix {issue_title}",
        session=session,
        source_analysis_issue_id=analysis_issue_id,
    )


def generate_program_from_issue(user_id: UUID, issue_id: UUID, session: Session) -> ProgramDTO:
    """Coach/browse path: create an active program directly from an issue with no
    source analysis. The issue must be a global catalog issue (user_id NULL) or one
    the user authored. Idempotent on the issue for this user."""
    existing = repo.get_active_program_for_issue_id(user_id, issue_id, session)
    if existing:
        raise exceptions.ConflictException("You already have an active program for this issue.")

    issue = issue_repo.get_issue_by_id(issue_id, session)
    if not issue:
        raise exceptions.NotFoundException("Issue", str(issue_id))

    # Catalog issues (user_id NULL) are usable by anyone; a custom issue is private
    # to its author.
    if issue.user_id is not None and str(issue.user_id) != str(user_id):
        raise exceptions.ForbiddenException("You do not have access to this issue.")

    return _seed_program(
        user_id=user_id,
        issue_id=issue_id,
        title=f"Fix {issue.title}",
        session=session,
        source_analysis_issue_id=None,
    )


def remove_focus_for_issue(user_id: UUID, issue_id: UUID, session: Session) -> None:
    """Remove a browse/coach focus from the user's home.

    - custom (coach-authored) issue the user owns -> delete the issue; its program,
      steps, drill states cascade. Gone for good.
    - catalog (browse) issue -> delete the user's program(s) for it; the shared issue
      is never touched. Home shows catalog issues only via a program, so it disappears.

    Analysis-diagnosed issues are removed via the analysis-issue dismissal path, not
    here. Ownership is enforced: a user can only remove their own program / own custom
    issue.
    """
    issue = issue_repo.get_issue_by_id(issue_id, session)
    if not issue:
        raise exceptions.NotFoundException("Issue", str(issue_id))

    if issue.source == "custom":
        if str(issue.user_id) != str(user_id):
            raise exceptions.ForbiddenException("You do not have access to this issue.")
        issue_repo.delete_issue(issue, session)
        return

    for program in repo.get_programs_for_issue(user_id, issue_id, session):
        repo.delete_program(program, session)


def _seed_program(
    user_id: UUID,
    issue_id: UUID,
    title: str,
    session: Session,
    source_analysis_issue_id: UUID | None,
) -> ProgramDTO:
    """Shared seeding for every entry point (AI, coach, browse): enforce one active
    program, create the program over `issue_id`, and seed one spaced-repetition
    state per linked drill."""
    # One active program at a time: block starting a new focus while another is live.
    if repo.get_active_programs_by_user(user_id, session):
        raise exceptions.ConflictException("Finish your current focus first.")

    drills = drill_repo.get_drills_by_issue_id(issue_id, session)

    program = models.Program(
        user_id=user_id,
        analysis_issue_id=source_analysis_issue_id,
        issue_id=issue_id,
        title=title,
        status="active",
    )
    repo.create_program(program, session)

    states = [
        models.ProgramDrillState(program_id=program.id, drill_id=drill.id, strength=0)
        for drill in drills
    ]
    if states:
        repo.create_drill_states(states, session)

    return _program_to_dto(program, session)


def get_active_program(
    user_id: UUID,
    analysis_issue_id: UUID | None,
    session: Session,
    issue_id: UUID | None = None,
) -> ProgramDTO | None:
    if analysis_issue_id is not None:
        program = repo.get_active_program_for_issue(user_id, analysis_issue_id, session)
    elif issue_id is not None:
        program = repo.get_active_program_for_issue_id(user_id, issue_id, session)
    else:
        active = repo.get_active_programs_by_user(user_id, session)
        program = active[0] if active else None

    return _program_to_dto(program, session) if program else None


def get_program(program_id: UUID, user_id: UUID, session: Session) -> ProgramDTO:
    program = repo.get_program_by_id(program_id, session)
    _verify_owner(program, program_id, user_id)
    return _program_to_dto(program, session)


def get_next_step(program_id: UUID, user_id: UUID, session: Session) -> ProgramStepDTO | None:
    """Return the pending step, scheduling (and persisting) one if none exists."""
    program = repo.get_program_by_id(program_id, session)
    _verify_owner(program, program_id, user_id)

    pending = repo.get_pending_step(program_id, session)
    if pending is None:
        pending = _schedule_next_step(program_id, session)
    return _step_to_dto_resolved(pending, session)


def complete_step(
    program_id: UUID,
    step_id: UUID,
    user_id: UUID,
    grades: list[DrillGradeDTO],
    practice_session_id: UUID | None,
    session: Session,
) -> StepAdvanceDTO:
    """Apply per-drill grades to the spaced-repetition state, mark the step
    completed, then schedule the next step."""
    program = repo.get_program_by_id(program_id, session)
    _verify_owner(program, program_id, user_id)

    step = repo.get_step_by_id(step_id, session)
    if not step or step.program_id != program_id:
        raise exceptions.NotFoundException("ProgramStep", str(step_id))

    if step.session_type == "range" and grades:
        _apply_grades(program_id, grades, session)

    step.status = "completed"
    if practice_session_id is not None:
        step.practice_session_id = practice_session_id
    repo.update_step(step, session)

    next_step = _schedule_next_step(program_id, session)

    grooved_count, total_drills = _groove_progress(program_id, session)

    # Graduate: once every drill is grooved, the program is done — it sinks and the
    # next issue becomes the focus (one program at a time).
    if total_drills > 0 and grooved_count == total_drills and program.status == "active":
        program.status = "completed"
        repo.update_program(program, session)

    title_map = _drill_title_map([step, next_step], session)
    return StepAdvanceDTO(
        completed_step=_step_to_dto(step, title_map),
        next_step=_step_to_dto(next_step, title_map),
        program_status=program.status,
        grooved_count=grooved_count,
        total_drills=total_drills,
    )


# =========== SCHEDULING ============

def _schedule_next_step(program_id: UUID, session: Session) -> models.ProgramStep:
    """Decide the next session type from history, pick drills by strength, persist
    a pending step."""
    completed = repo.get_completed_steps(program_id, session)
    order_index = len(completed)
    session_type = _decide_next_type(completed)

    if session_type == "range":
        states = repo.get_drill_states_by_program_id(program_id, session)
        drill_ids = _pick_due_drills(states, NUM_DRILLS_PER_RANGE)
        prescription = {
            "drill_ids": [str(d) for d in drill_ids],
            "num_blocks": len(drill_ids),
            "cue": None,
        }
    elif session_type == "play":
        prescription = {"holes": PLAY_HOLES_DEFAULT, "focus": PLAY_FOCUS_DEFAULT}
    else:  # retest
        # A program with no source analysis (coach/browse seeded) can't be
        # AI-re-analyzed, so its retest is a pure self-comparison of the golfer's
        # own footage.
        program = repo.get_program_by_id(program_id, session)
        instruction = (
            RETEST_INSTRUCTION
            if program is not None and program.analysis_issue_id is not None
            else RETEST_INSTRUCTION_SELF
        )
        prescription = {"instruction": instruction}

    step = models.ProgramStep(
        program_id=program_id,
        order_index=order_index,
        session_type=session_type,
        prescription=prescription,
        status="pending",
    )
    return repo.create_step(step, session)


def _decide_next_type(completed_steps: list[models.ProgramStep]) -> str:
    """`WORK_CYCLE` repeats forever; a retest is inserted after every
    `RETEST_CADENCE` work sessions. Work = range or play."""
    work_steps = [s for s in completed_steps if s.session_type in ("range", "play")]

    work_since_retest = 0
    for step in reversed(completed_steps):
        if step.session_type == "retest":
            break
        work_since_retest += 1

    if work_since_retest >= RETEST_CADENCE:
        return "retest"

    return WORK_CYCLE[len(work_steps) % len(WORK_CYCLE)]


def _pick_due_drills(states: list[models.ProgramDrillState], count: int) -> list[UUID]:
    """Lowest-strength drills first; ties broken by oldest last_seen (never-seen
    drills surface first)."""
    if not states or count <= 0:
        return []
    ordered = sorted(
        states,
        key=lambda s: (
            s.strength,
            s.last_seen_at is not None,  # False (never seen) sorts first
            s.last_seen_at or _EPOCH,
        ),
    )
    return [s.drill_id for s in ordered[:count]]


# =========== GRADING ============

def _apply_grades(program_id: UUID, grades: list[DrillGradeDTO], session: Session) -> None:
    states = repo.get_drill_states_by_program_id(program_id, session)
    state_by_drill = {state.drill_id: state for state in states}
    now = datetime.now(tz=timezone.utc)

    for grade in grades:
        state = state_by_drill.get(grade.drill_id)
        if state is None or grade.grade not in GRADE_STRENGTH_DELTA:
            continue
        state.strength = _next_strength(state.strength, grade.grade)
        state.last_seen_at = now
        state.times_seen = (state.times_seen or 0) + 1
        state.last_grade = grade.grade
        repo.update_drill_state(state, session)


def _next_strength(strength: int, grade: str) -> int:
    """Apply a grade to a drill's strength, clamped to [0, STRENGTH_MAX]. Unknown
    grades leave strength unchanged."""
    delta = GRADE_STRENGTH_DELTA.get(grade, 0)
    return max(0, min(STRENGTH_MAX, strength + delta))


# =========== DTO HELPERS ============

def _verify_owner(program: models.Program | None, program_id: UUID, user_id: UUID) -> None:
    if program is None:
        raise exceptions.NotFoundException("Program", str(program_id))
    if str(program.user_id) != str(user_id):
        raise exceptions.ForbiddenException("You do not have access to this program.")


def _groove_progress(program_id: UUID, session: Session) -> tuple[int, int]:
    states = repo.get_drill_states_by_program_id(program_id, session)
    grooved = sum(1 for s in states if s.strength >= GROOVED_THRESHOLD)
    return grooved, len(states)


def _drill_title_map(steps: list[models.ProgramStep], session: Session) -> dict[str, str]:
    """Batch-resolve drill ids → titles across the given steps' range prescriptions
    (one query). drill_ids are stored as strings in the prescription JSON."""
    ids: set[str] = set()
    for step in steps:
        if step.session_type == "range":
            ids.update((step.prescription or {}).get("drill_ids", []))
    if not ids:
        return {}
    drills = drill_repo.get_drills_by_ids([UUID(i) for i in ids], session)
    return {str(d.id): d.title for d in drills}


def _program_to_dto(program: models.Program, session: Session) -> ProgramDTO:
    grooved_count, total_drills = _groove_progress(program.id, session)
    title_map = _drill_title_map(list(program.steps), session)
    return ProgramDTO(
        id=program.id,
        user_id=program.user_id,
        analysis_issue_id=program.analysis_issue_id,
        issue_id=program.issue_id,
        title=program.title,
        status=program.status,
        created_at=program.created_at,
        grooved_count=grooved_count,
        total_drills=total_drills,
        steps=[_step_to_dto(s, title_map) for s in program.steps],
    )


def _step_to_dto(step: models.ProgramStep, title_map: dict[str, str]) -> ProgramStepDTO:
    drills: list[StepDrillDTO] = []
    if step.session_type == "range":
        for did in (step.prescription or {}).get("drill_ids", []):
            title = title_map.get(did)
            if title is not None:
                drills.append(StepDrillDTO(id=UUID(did), title=title))

    return ProgramStepDTO(
        id=step.id,
        program_id=step.program_id,
        order_index=step.order_index,
        session_type=step.session_type,
        prescription=step.prescription or {},
        status=step.status,
        practice_session_id=step.practice_session_id,
        drills=drills,
    )


def _step_to_dto_resolved(step: models.ProgramStep, session: Session) -> ProgramStepDTO:
    """Convenience for single-step callers: build the title map for one step."""
    return _step_to_dto(step, _drill_title_map([step], session))
