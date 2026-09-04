from core.infrastructure.db import models
from core.infrastructure.db.repositories import programs as repo
from core.infrastructure.db.repositories import drills as drill_repo
from core.infrastructure.db.repositories import analysis_issues as analysis_issue_repo
from core.infrastructure.db.repositories import issues as issue_repo
from core.services import exceptions
from core.services import drill_metrics
from core.services.dtos.program_service_dto import (
    ProgramDTO,
    ProgramStepDTO,
    StepDrillDTO,
    StepAdvanceDTO,
    DrillGradeDTO,
)

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from uuid import UUID
from datetime import datetime, timezone
import logging

log = logging.getLogger(__name__)


# =========== TUNING CONSTANTS ============
#
# Open-ended, self-scheduling program driven by the golfer's own block-feel
# (Rough/OK/Dialed). AI stays backstage. The schedule concentrates range time on
# the drills that still feel rough; grooved drills fade out.

STRENGTH_MAX = 5
GROOVED_THRESHOLD = 3          # strength >= this => the drill is "grooved"
NUM_DRILLS_PER_RANGE = 2       # how many drills fill a range session

# Lightweight spaced repetition: how a grade moves a drill's strength.
GRADE_STRENGTH_DELTA: dict[str, int] = {"rough": -1, "ok": 0, "dialed": 1}

# How many programs a golfer may hold in one area at once. Two, because one focus per area
# was too tight once the whole game was in the catalog, and unlimited turns "start a
# program" into a free action that stops meaning "I am committing to this". Enforced by the
# partial unique index programs_one_active_per_area_slot -- this constant only names the
# slot count that index implies.
SLOTS_PER_AREA = 2

_EPOCH = datetime(1970, 1, 1, tzinfo=timezone.utc)


# =========== PUBLIC API ============

def generate_program(
    user_id: UUID,
    session: Session,
    issue_id: UUID | None = None,
    analysis_issue_id: UUID | None = None,
) -> ProgramDTO:
    """Start grooving an issue, from either entry point. Idempotent.

    Takes `analysis_issue_id` (AI path) or `issue_id` (browse path). Asking for a program
    you already have returns it rather than raising. See ADR-0004.
    """
    if analysis_issue_id is not None:
        analysis_issue = analysis_issue_repo.get_analysis_issue_by_id(analysis_issue_id, session)
        if not analysis_issue:
            raise exceptions.NotFoundException("AnalysisIssue", str(analysis_issue_id))

        # An analysis issue is owned through its analysis: it exists only inside one
        # golfer's video, so there is no shared-catalog case here.
        if analysis_issue.analysis is None or str(analysis_issue.analysis.user_id) != str(user_id):
            raise exceptions.ForbiddenException("You do not have access to this analysis issue.")

        resolved_issue_id = analysis_issue.issue_id
        title = analysis_issue.issue.title if analysis_issue.issue else "your swing issue"
    elif issue_id is not None:
        issue = issue_repo.get_issue_by_id(issue_id, session)
        if not issue:
            raise exceptions.NotFoundException("Issue", str(issue_id))

        # Catalog issues (user_id NULL) are usable by anyone; a custom issue is private to
        # its author.
        if issue.user_id is not None and str(issue.user_id) != str(user_id):
            raise exceptions.ForbiddenException("You do not have access to this issue.")

        resolved_issue_id = issue_id
        title = issue.title
    else:
        raise exceptions.ValidationException(
            "Provide either analysis_issue_id or issue_id."
        )

    # Checked after the ownership gates above, so asking about someone else's issue is
    # refused rather than answered.
    existing = repo.get_active_program_for_issue_id(user_id, resolved_issue_id, session)
    if existing:
        return _program_to_dto(existing, session)

    return _seed_program(
        user_id=user_id,
        issue_id=resolved_issue_id,
        title=f"Fix {title}",
        session=session,
        source_analysis_issue_id=analysis_issue_id,
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
    """Shared seeding for every entry point (AI, coach, browse): claim a slot in the
    issue's area, create the program, seed one spaced-repetition state per linked drill,
    and schedule the first step.

    The first step is created here rather than lazily on read, so that `get_next_step`
    can stay a pure read (see its docstring)."""
    issue = issue_repo.get_issue_by_id(issue_id, session)
    if not issue:
        raise exceptions.NotFoundException("Issue", str(issue_id))

    # Area is half of the uniqueness key that caps programs per area, and a NULL would opt
    # this program out of the cap entirely -- NULLs never collide in a unique index, so one
    # golfer could stack unlimited area-less programs.
    #
    # issues.area is NOT NULL DEFAULT 'FULL_SWING', so this cannot fire today and has no
    # test: it is here to fail loudly rather than silently uncap the golfer if that column
    # is ever relaxed.
    if issue.area is None:
        raise exceptions.ValidationException(
            "This focus has no area assigned yet, so it can't be started."
        )

    slot = _allocate_slot(user_id, issue.area, session)

    drills = drill_repo.get_drills_by_issue_id(issue_id, session)

    program = models.Program(
        user_id=user_id,
        analysis_issue_id=source_analysis_issue_id,
        issue_id=issue_id,
        title=title,
        status="active",
        area=issue.area,
        slot=slot,
    )
    try:
        repo.create_program(program, session)
    except IntegrityError:
        # Something took this slot (or this issue) between _allocate_slot's read and this
        # insert. The index is the authority and it just refused us.
        #
        # Deliberately NOT reported as "you already have two focuses here": we do not know
        # that, and the golfer may well have zero. In practice this means a double-submit
        # got past the client, so it is logged at warning -- that log line is the only way
        # to find out the client-side guard has broken.
        session.rollback()
        log.warning(
            "program slot race: insert lost to a concurrent request",
            extra={
                "user_id": str(user_id),
                "issue_id": str(issue_id),
                "area": issue.area,
                "slot": slot,
            },
        )
        raise exceptions.ConflictException(
            "Couldn't start that focus just now. Try again."
        )

    states = [
        models.ProgramDrillState(program_id=program.id, drill_id=drill.id, strength=0)
        for drill in drills
    ]
    if states:
        repo.create_drill_states(states, session)

    _schedule_next_step(program.id, session)

    log.info(
        "program seeded",
        extra={
            "user_id": str(user_id),
            "program_id": str(program.id),
            "issue_id": str(issue_id),
            "area": issue.area,
            "slot": slot,
            "drill_count": len(states),
        },
    )
    return _program_to_dto(program, session)


def _allocate_slot(user_id: UUID, area: str, session: Session) -> int:
    """Pick the free slot (0 or 1) for this golfer in this area.

    The partial unique index programs_one_active_per_area_slot is what actually enforces
    the cap. This function exists to fail with a sentence the golfer can act on, before
    Postgres fails with an IntegrityError they cannot. `_seed_program` still handles the
    race where both agree a slot is free.
    """
    taken = {p.slot for p in repo.get_active_programs_by_area(user_id, area, session)}
    free = sorted(set(range(SLOTS_PER_AREA)) - taken)
    if not free:
        log.info(
            "program slots full",
            extra={"user_id": str(user_id), "area": area},
        )
        raise exceptions.ConflictException(
            f"You're already working two {_area_label(area, session)} focuses. "
            "Finish one before starting another."
        )
    return free[0]


def _area_label(area: str, session: Session) -> str:
    """Golfer-facing name for an area, for error messages only.

    Looked up on the failure path rather than carried around, so the ordinary case never
    pays for it. Falls back to the raw key if the row is missing — a clumsy message beats
    a second exception thrown while building the first one's text.
    """
    row = session.get(models.TaxonomyArea, area)
    return row.golfer_label.lower() if row else area.replace("_", " ").lower()


def get_active_program(
    user_id: UUID,
    analysis_issue_id: UUID | None,
    session: Session,
    issue_id: UUID | None = None,
) -> ProgramDTO | None:
    """The active program for one issue.

    An id is required. This used to fall back to "the most recent active program" when
    given neither, which was a sensible answer only while a golfer could hold exactly one.
    With up to two programs per area it would silently pick one of ten. Callers that want
    the whole set use `list_active_programs`.
    """
    if analysis_issue_id is not None:
        program = repo.get_active_program_for_issue(user_id, analysis_issue_id, session)
    elif issue_id is not None:
        program = repo.get_active_program_for_issue_id(user_id, issue_id, session)
    else:
        raise exceptions.ValidationException(
            "Provide either analysis_issue_id or issue_id."
        )

    return _program_to_dto(program, session) if program else None


def list_active_programs(user_id: UUID, session: Session) -> list[ProgramDTO]:
    """Every active program for the golfer, each with its pending step resolved.

    This backs Home, so it runs on every app foreground and pull-to-refresh, and the
    number of programs is something the golfer controls. Building it by calling
    `_program_to_dto` per program would issue two queries each plus one more for the step
    -- around thirty for a full slate. Everything is batched instead, so the cost is four
    queries whether the golfer has one program or ten. Same reasoning as the batched drill
    lookup in `_apply_grades`.
    """
    programs = repo.get_active_programs_by_user(user_id, session)
    if not programs:
        return []

    program_ids = [p.id for p in programs]

    states_by_program: dict[UUID, list[models.ProgramDrillState]] = {}
    for state in repo.get_drill_states_by_program_ids(program_ids, session):
        states_by_program.setdefault(state.program_id, []).append(state)

    # get_pending_steps_by_program_ids orders by order_index, and an active program holds
    # at most one pending step, so first-wins is both stable and correct.
    step_by_program: dict[UUID, models.ProgramStep] = {}
    for step in repo.get_pending_steps_by_program_ids(program_ids, session):
        step_by_program.setdefault(step.program_id, step)

    title_map = _drill_title_map(list(step_by_program.values()), session)

    dtos: list[ProgramDTO] = []
    for program in programs:
        states = states_by_program.get(program.id, [])
        grooved = sum(1 for s in states if s.strength >= GROOVED_THRESHOLD)
        step = step_by_program.get(program.id)
        dtos.append(
            ProgramDTO(
                id=program.id,
                user_id=program.user_id,
                analysis_issue_id=program.analysis_issue_id,
                issue_id=program.issue_id,
                title=program.title,
                status=program.status,
                created_at=program.created_at,
                grooved_count=grooved,
                total_drills=len(states),
                area=program.area,
                slot=program.slot,
                steps=[],
                next_step=_step_to_dto(step, title_map) if step else None,
            )
        )
    return dtos


def get_program(program_id: UUID, user_id: UUID, session: Session) -> ProgramDTO:
    program = repo.get_program_by_id(program_id, session)
    _verify_owner(program, program_id, user_id)
    return _program_to_dto(program, session)


def get_next_step(program_id: UUID, user_id: UUID, session: Session) -> ProgramStepDTO | None:
    """Return the pending step, or None if the program has none.

    A pure read. It used to schedule a step when it found none, which made a GET write to
    the database: the list endpoint reads every active program on each Home render, so one
    pull-to-refresh could insert a row per program, and two devices refreshing at once
    could collide on idx_program_steps_unique_order and surface as a 500 on what the
    client believes is a plain read.

    Steps are scheduled on the write paths that earn them instead — `_seed_program`
    creates the first, `complete_step` creates each successor — so an active program
    always has exactly one pending step and None here is real information.
    """
    program = repo.get_program_by_id(program_id, session)
    _verify_owner(program, program_id, user_id)

    pending = repo.get_pending_step(program_id, session)
    return _step_to_dto_resolved(pending, session) if pending else None


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

    # Graduate: once every drill is grooved the program is done. It sinks out of the
    # active set and frees its slot, so the golfer can start something new in this area.
    if total_drills > 0 and grooved_count == total_drills and program.status == "active":
        program.status = "completed"
        repo.update_program(program, session)
        log.info(
            "program completed: every drill grooved",
            extra={
                "user_id": str(user_id),
                "program_id": str(program_id),
                "area": program.area,
                "slot": program.slot,
                "total_drills": total_drills,
            },
        )

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
    """Pick the drills that feel roughest and persist a pending step for them.

    Every step is practice now. There used to be a repeating range/range/play cycle that
    sent the golfer to the course every third session, but playing a round is one activity
    that serves every open program at once -- with several programs running it produced
    several simultaneous "go play 9 holes" prompts for the same round. Rounds live in
    practice_sessions with session_type = 'play' and are not scheduled by any program.

    The type stays the string 'range' in this PR; renaming it to 'practice' is a separate
    change so this one does not also move vocabulary.
    """
    completed = repo.get_completed_steps(program_id, session)
    states = repo.get_drill_states_by_program_id(program_id, session)
    drill_ids = _pick_due_drills(states, NUM_DRILLS_PER_RANGE)

    step = models.ProgramStep(
        program_id=program_id,
        order_index=len(completed),
        session_type="range",
        prescription={
            "drill_ids": [str(d) for d in drill_ids],
            "num_blocks": len(drill_ids),
            "cue": None,
        },
        status="pending",
    )
    return repo.create_step(step, session)


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

    # One query for every scored drill in the batch rather than one per grade. A session is
    # only NUM_DRILLS_PER_RANGE drills today, but this runs on the completion path and the
    # N+1 would be invisible until a session got longer.
    scored_ids = [g.drill_id for g in grades if g.metric_value is not None]
    metric_by_drill = {
        d.id: d.metric for d in drill_repo.get_drills_by_ids(scored_ids, session)
    } if scored_ids else {}

    for grade in grades:
        state = state_by_drill.get(grade.drill_id)
        if state is None:
            continue
        resolved = _resolve_grade(grade, metric_by_drill)
        if resolved not in GRADE_STRENGTH_DELTA:
            continue
        state.strength = _next_strength(state.strength, resolved)
        state.last_seen_at = now
        state.times_seen = (state.times_seen or 0) + 1
        state.last_grade = resolved
        repo.update_drill_state(state, session)


def _resolve_grade(grade: DrillGradeDTO, metric_by_drill: dict) -> str | None:
    """A feel block reports its own grade; a scored block reports a number we grade here.

    Scored wins if somehow both arrive: the number is the measurement, the tap is an
    opinion about it.
    """
    if grade.metric_value is not None:
        return drill_metrics.grade_for(
            metric_by_drill.get(grade.drill_id), grade.metric_value
        )
    return grade.grade


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
        area=program.area,
        slot=program.slot,
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
