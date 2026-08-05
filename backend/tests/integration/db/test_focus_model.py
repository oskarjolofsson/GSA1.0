import uuid
import pytest

from core.infrastructure.db.models.Issue import Issue
from core.infrastructure.db.models.Drill import Drill
from core.infrastructure.db.models.IssueDrill import IssueDrill
from core.infrastructure.db.models.Analysis import Analysis
from core.infrastructure.db.models.AnalysisIssue import AnalysisIssue
from core.infrastructure.db.models.Program import Program
from core.infrastructure.db.models.ProgramStep import ProgramStep
from core.infrastructure.db.repositories.issues import create_issue
from core.infrastructure.db.repositories.drills import create_drill
from core.infrastructure.db.repositories.analysis import create_analysis
from core.infrastructure.db.repositories.analysis_issues import create_analysis_issue
from core.infrastructure.db.repositories import programs as programs_repo

from core.services import program_service as ps
from core.services import issues_service
from core.services import analysis_service
from core.services import exceptions
from core.services.dtos.program_service_dto import DrillGradeDTO


def _seed_issue(db_session, user_id, title, confidence, num_drills=0):
    issue = create_issue(Issue(title=title, description="d"), db_session)
    for i in range(num_drills):
        drill = create_drill(
            Drill(title=f"{title} drill {i}", task="t", success_signal="s", fault_indicator="f"),
            db_session,
        )
        db_session.add(IssueDrill(issue_id=issue.id, drill_id=drill.id))
    db_session.flush()
    analysis = create_analysis(
        Analysis(user_id=user_id, model_version="v1", status="completed", success=True),
        db_session,
    )
    analysis_issue = create_analysis_issue(
        AnalysisIssue(analysis_id=analysis.id, issue_id=issue.id, confidence=confidence), db_session
    )
    return issue, analysis_issue


# ---------------- auto-graduate ----------------

def test_program_graduates_when_all_drills_grooved(db_session, test_user):
    user_id = test_user["user_id"]
    _, analysis_issue = _seed_issue(db_session, user_id, "Early extension", 0.8, num_drills=1)
    program = ps.generate_program_for_issue(user_id, analysis_issue.id, db_session)

    # Grade the single drill 'dialed' on every range step until it grooves.
    for _ in range(20):
        step = ps.get_next_step(program.id, user_id, db_session)
        grades = []
        if step.session_type == "range":
            grades = [DrillGradeDTO(drill_id=uuid.UUID(d), grade="dialed") for d in step.prescription["drill_ids"]]
        advance = ps.complete_step(program.id, step.id, user_id, grades=grades, practice_session_id=None, session=db_session)
        if advance.program_status == "completed":
            break

    refreshed = programs_repo.get_program_by_id(program.id, db_session)
    assert refreshed.status == "completed"


# ---------------- cap = 2 active programs per area ----------------

def test_two_active_programs_in_one_area_are_allowed(db_session, test_user):
    """The old model allowed exactly one focus. Working two things in an area at once is
    the point of this change, so it must succeed and the two must take separate slots."""
    user_id = test_user["user_id"]
    _, ai_a = _seed_issue(db_session, user_id, "Issue A", 0.9, num_drills=2)
    _, ai_b = _seed_issue(db_session, user_id, "Issue B", 0.8, num_drills=2)

    p_a = ps.generate_program_for_issue(user_id, ai_a.id, db_session)
    p_b = ps.generate_program_for_issue(user_id, ai_b.id, db_session)

    assert {p_a.slot, p_b.slot} == {0, 1}
    assert p_a.area == p_b.area == "FULL_SWING"


def test_third_active_program_in_one_area_is_blocked(db_session, test_user):
    """Two per area, not unlimited: opening a program has to keep meaning "I am
    committing to this"."""
    user_id = test_user["user_id"]
    _, ai_a = _seed_issue(db_session, user_id, "Issue A", 0.9, num_drills=2)
    _, ai_b = _seed_issue(db_session, user_id, "Issue B", 0.8, num_drills=2)
    _, ai_c = _seed_issue(db_session, user_id, "Issue C", 0.7, num_drills=2)

    ps.generate_program_for_issue(user_id, ai_a.id, db_session)
    ps.generate_program_for_issue(user_id, ai_b.id, db_session)
    with pytest.raises(exceptions.ConflictException):
        ps.generate_program_for_issue(user_id, ai_c.id, db_session)


def test_areas_are_capped_independently(db_session, test_user):
    """A full slate of full-swing work must not block putting. This is the whole reason
    the cap is per-area rather than global."""
    user_id = test_user["user_id"]
    _, ai_a = _seed_issue(db_session, user_id, "Swing A", 0.9, num_drills=2)
    _, ai_b = _seed_issue(db_session, user_id, "Swing B", 0.8, num_drills=2)
    putt_issue, ai_p = _seed_issue(db_session, user_id, "Putting", 0.7, num_drills=2)
    putt_issue.area = "PUTTING"
    db_session.flush()

    ps.generate_program_for_issue(user_id, ai_a.id, db_session)
    ps.generate_program_for_issue(user_id, ai_b.id, db_session)
    putting = ps.generate_program_for_issue(user_id, ai_p.id, db_session)

    assert putting.area == "PUTTING"
    assert putting.slot == 0  # its own area's slots are untouched by the full-swing pair


def test_completing_a_program_frees_its_slot(db_session, test_user):
    """The cap counts active programs only. Finishing one has to make room immediately,
    or a golfer who works steadily eventually locks themselves out of an area."""
    user_id = test_user["user_id"]
    _, ai_a = _seed_issue(db_session, user_id, "Issue A", 0.9, num_drills=2)
    _, ai_b = _seed_issue(db_session, user_id, "Issue B", 0.8, num_drills=2)
    _, ai_c = _seed_issue(db_session, user_id, "Issue C", 0.7, num_drills=2)

    p_a = ps.generate_program_for_issue(user_id, ai_a.id, db_session)
    ps.generate_program_for_issue(user_id, ai_b.id, db_session)

    program_a = programs_repo.get_program_by_id(p_a.id, db_session)
    program_a.status = "completed"
    db_session.flush()

    p_c = ps.generate_program_for_issue(user_id, ai_c.id, db_session)
    assert p_c.slot == p_a.slot  # reuses the freed slot rather than inventing a third


def test_second_program_on_the_same_issue_is_refused(db_session, test_user):
    """Two programs on one issue would groove identical drill sets against separate
    counters with nothing to make them diverge. The AI path returns the existing one."""
    user_id = test_user["user_id"]
    _, ai = _seed_issue(db_session, user_id, "Issue A", 0.9, num_drills=2)

    first = ps.generate_program_for_issue(user_id, ai.id, db_session)
    second = ps.generate_program_for_issue(user_id, ai.id, db_session)
    assert first.id == second.id
    assert len(programs_repo.get_active_programs_by_user(user_id, db_session)) == 1


def test_generate_still_idempotent_for_same_issue(db_session, test_user):
    user_id = test_user["user_id"]
    _, ai = _seed_issue(db_session, user_id, "Issue A", 0.9, num_drills=2)
    p1 = ps.generate_program_for_issue(user_id, ai.id, db_session)
    p2 = ps.generate_program_for_issue(user_id, ai.id, db_session)  # not blocked
    assert p1.id == p2.id


def test_slot_race_reports_a_retry_not_a_false_full_house(db_session, test_user, monkeypatch):
    """When the unique index refuses an insert, the golfer must not be told they already
    have two focuses -- they may have none. That claim is only true when _allocate_slot
    itself found no free slot.

    Simulates the race by handing back a slot that is already taken, which is exactly the
    state a concurrent request leaves behind between the read and the insert.
    """
    user_id = test_user["user_id"]
    _, ai_a = _seed_issue(db_session, user_id, "Issue A", 0.9, num_drills=2)
    _, ai_b = _seed_issue(db_session, user_id, "Issue B", 0.8, num_drills=2)

    ps.generate_program_for_issue(user_id, ai_a.id, db_session)  # takes slot 0

    monkeypatch.setattr(ps, "_allocate_slot", lambda *a, **k: 0)  # collide on purpose
    with pytest.raises(exceptions.ConflictException) as err:
        ps.generate_program_for_issue(user_id, ai_b.id, db_session)

    message = str(err.value).lower()
    assert "try again" in message
    assert "already working two" not in message


# ---------------- reads must not write ----------------

def _count_steps(db_session):
    return db_session.query(ProgramStep).count()


def test_get_next_step_does_not_write(db_session, test_user):
    """get_next_step used to schedule a step when it found none, which made a plain read
    insert rows. The list endpoint reads every active program on each Home render, so
    that turned one pull-to-refresh into a write per program and could collide on
    idx_program_steps_unique_order -- a 500 on a refresh with two devices open.
    """
    user_id = test_user["user_id"]
    _, ai = _seed_issue(db_session, user_id, "Issue A", 0.9, num_drills=2)
    program = ps.generate_program_for_issue(user_id, ai.id, db_session)

    before = _count_steps(db_session)
    for _ in range(5):
        step = ps.get_next_step(program.id, user_id, db_session)
        assert step is not None  # seeding scheduled it, so reads always find one
    assert _count_steps(db_session) == before


# ---------------- focus selection / ordering ----------------

def test_todays_issue_is_active_program_issue(db_session, test_user):
    user_id = test_user["user_id"]
    _seed_issue(db_session, user_id, "High conf, no program", 0.95)
    _, ai_focus = _seed_issue(db_session, user_id, "Focus", 0.3, num_drills=1)
    ps.generate_program_for_issue(user_id, ai_focus.id, db_session)

    todays = issues_service.get_todays_issue(user_id, db_session)
    assert todays.title == "Focus"
    assert todays.program_status == "active"


def test_todays_issue_picks_among_several_active_programs(db_session, test_user):
    """REGRESSION. get_todays_issue returns issues[0] of the focus-ordered list, which
    was written when a golfer could hold exactly one program. With several active it must
    still return one of THEM (highest confidence), not fall through to unstarted work and
    not blow up. It is a tiebreaker, not a practice diet -- see the function's docstring.
    """
    user_id = test_user["user_id"]
    _seed_issue(db_session, user_id, "Unstarted but confident", 0.99)
    _, ai_low = _seed_issue(db_session, user_id, "Active low", 0.30, num_drills=1)
    _, ai_high = _seed_issue(db_session, user_id, "Active high", 0.60, num_drills=1)

    ps.generate_program_for_issue(user_id, ai_low.id, db_session)
    ps.generate_program_for_issue(user_id, ai_high.id, db_session)

    todays = issues_service.get_todays_issue(user_id, db_session)
    assert todays.program_status == "active"
    assert todays.title == "Active high"

    # Both active issues group ahead of the unstarted one, despite its higher confidence.
    ordered = issues_service.get_issues_by_user_id(user_id, db_session)
    assert [i.title for i in ordered[:2]] == ["Active high", "Active low"]


def test_completed_issues_sink_below_not_started(db_session, test_user):
    user_id = test_user["user_id"]
    not_started, _ = _seed_issue(db_session, user_id, "Not started", 0.4)
    done_issue, ai_done = _seed_issue(db_session, user_id, "Done", 0.95, num_drills=1)
    # A completed program for the high-confidence issue should still sink below the
    db_session.add(
        Program(
            user_id=user_id,
            analysis_issue_id=ai_done.id,
            issue_id=done_issue.id,
            title="done",
            status="completed",
        )
    )
    db_session.flush()

    ordered = issues_service.get_issues_by_user_id(user_id, db_session)
    assert ordered[0].title == "Not started"
    assert ordered[-1].title == "Done" and ordered[-1].program_status == "completed"


# ---------------- remove / dismiss an issue ----------------

def test_removing_issue_abandons_program_and_drops_from_list(db_session, test_user):
    user_id = test_user["user_id"]
    issue, analysis_issue = _seed_issue(db_session, user_id, "Wrong issue", 0.8, num_drills=1)
    program = ps.generate_program_for_issue(user_id, analysis_issue.id, db_session)

    analysis_service.delete_analysis_issue(analysis_issue.id, db_session, user_id)

    # Program abandoned (so cap-1 is freed) and the issue is gone from the user's list.
    refreshed = programs_repo.get_program_by_id(program.id, db_session)
    assert refreshed.status == "abandoned"
    assert programs_repo.get_active_programs_by_user(user_id, db_session) == []
    titles = [i.title for i in issues_service.get_issues_by_user_id(user_id, db_session)]
    assert "Wrong issue" not in titles
