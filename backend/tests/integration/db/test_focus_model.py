import uuid
import pytest

from core.infrastructure.db.models.Issue import Issue
from core.infrastructure.db.models.Drill import Drill
from core.infrastructure.db.models.IssueDrill import IssueDrill
from core.infrastructure.db.models.Analysis import Analysis
from core.infrastructure.db.models.AnalysisIssue import AnalysisIssue
from core.infrastructure.db.models.Program import Program
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
    analysis = create_analysis(Analysis(user_id=user_id, model_version="v1"), db_session)
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


# ---------------- cap = 1 active program ----------------

def test_second_active_program_is_blocked(db_session, test_user):
    user_id = test_user["user_id"]
    _, ai_a = _seed_issue(db_session, user_id, "Issue A", 0.9, num_drills=2)
    _, ai_b = _seed_issue(db_session, user_id, "Issue B", 0.8, num_drills=2)

    ps.generate_program_for_issue(user_id, ai_a.id, db_session)  # active focus
    with pytest.raises(exceptions.ConflictException):
        ps.generate_program_for_issue(user_id, ai_b.id, db_session)


def test_generate_still_idempotent_for_same_issue(db_session, test_user):
    user_id = test_user["user_id"]
    _, ai = _seed_issue(db_session, user_id, "Issue A", 0.9, num_drills=2)
    p1 = ps.generate_program_for_issue(user_id, ai.id, db_session)
    p2 = ps.generate_program_for_issue(user_id, ai.id, db_session)  # not blocked
    assert p1.id == p2.id


# ---------------- focus selection / ordering ----------------

def test_todays_issue_is_active_program_issue(db_session, test_user):
    user_id = test_user["user_id"]
    _seed_issue(db_session, user_id, "High conf, no program", 0.95)
    _, ai_focus = _seed_issue(db_session, user_id, "Focus", 0.3, num_drills=1)
    ps.generate_program_for_issue(user_id, ai_focus.id, db_session)

    todays = issues_service.get_todays_issue(user_id, db_session)
    assert todays.title == "Focus"
    assert todays.program_status == "active"


def test_completed_issues_sink_below_not_started(db_session, test_user):
    user_id = test_user["user_id"]
    not_started, _ = _seed_issue(db_session, user_id, "Not started", 0.4)
    _, ai_done = _seed_issue(db_session, user_id, "Done", 0.95, num_drills=1)
    # A completed program for the high-confidence issue should still sink below the
    # not-started one.
    db_session.add(
        Program(user_id=user_id, analysis_issue_id=ai_done.id, title="done", status="completed")
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
