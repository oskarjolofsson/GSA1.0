import uuid
import pytest

from core.infrastructure.db.models.Issue import Issue
from core.infrastructure.db.models.Drill import Drill
from core.infrastructure.db.models.IssueDrill import IssueDrill
from core.infrastructure.db.models.Analysis import Analysis
from core.infrastructure.db.models.AnalysisIssue import AnalysisIssue
from core.infrastructure.db.models.PracticeSession import PracticeSession
from core.infrastructure.db.repositories.issues import create_issue
from core.infrastructure.db.repositories.drills import create_drill
from core.infrastructure.db.repositories.analysis import create_analysis
from core.infrastructure.db.repositories.analysis_issues import create_analysis_issue
from core.infrastructure.db.repositories import programs as repo

from core.services import program_service as ps
from core.services import exceptions
from core.services.dtos.program_service_dto import DrillGradeDTO


def _seed_analysis_issue(db_session, user_id, num_drills):
    """Create an issue with `num_drills` linked drills, owned by `user_id` via a
    user-owned analysis. Returns (analysis_issue, [drills])."""
    issue = create_issue(
        Issue(title="Early extension", description="desc", phase="IMPACT"), db_session
    )
    drills = []
    for i in range(num_drills):
        drill = create_drill(
            Drill(title=f"Drill {i}", task="t", success_signal="s", fault_indicator="f"),
            db_session,
        )
        db_session.add(IssueDrill(issue_id=issue.id, drill_id=drill.id))
        drills.append(drill)
    db_session.flush()

    analysis = create_analysis(Analysis(user_id=user_id, model_version="v1.0"), db_session)
    analysis_issue = create_analysis_issue(
        AnalysisIssue(analysis_id=analysis.id, issue_id=issue.id, confidence=0.9), db_session
    )
    return analysis_issue, drills


@pytest.fixture
def seeded(db_session, test_user):
    return _seed_analysis_issue(db_session, test_user["user_id"], num_drills=3)


# ---------------- generate ----------------

class TestGenerate:
    def test_generate_creates_active_program_and_seeds_states(self, db_session, test_user, seeded):
        """
        Creates an analysis issue with 3 drills
        Generates a program for the issue
        Tests that the program is active, has 3 drills, and all drill states are initialized
        """
        
        analysis_issue, drills = seeded
        program = ps.generate_program_for_issue(test_user["user_id"], analysis_issue.id, db_session)

        assert program.status == "active"
        assert program.total_drills == 3
        assert program.grooved_count == 0
        states = repo.get_drill_states_by_program_id(program.id, db_session)
        assert {s.drill_id for s in states} == {d.id for d in drills}
        assert all(s.strength == 0 for s in states)

    def test_generate_is_idempotent(self, db_session, test_user, seeded):
        
        analysis_issue, _ = seeded
        p1 = ps.generate_program_for_issue(test_user["user_id"], analysis_issue.id, db_session)
        p2 = ps.generate_program_for_issue(test_user["user_id"], analysis_issue.id, db_session)
        assert p1.id == p2.id
        assert len(repo.get_active_programs_by_user(test_user["user_id"], db_session)) == 1

    def test_generate_rejects_non_owner(self, db_session, test_user, seeded):
        analysis_issue, _ = seeded
        with pytest.raises(exceptions.ForbiddenException):
            ps.generate_program_for_issue(uuid.uuid4(), analysis_issue.id, db_session)

    def test_generate_missing_issue_raises_not_found(self, db_session, test_user):
        with pytest.raises(exceptions.NotFoundException):
            ps.generate_program_for_issue(test_user["user_id"], uuid.uuid4(), db_session)

    def test_generate_with_zero_drills(self, db_session, test_user):
        analysis_issue, _ = _seed_analysis_issue(db_session, test_user["user_id"], num_drills=0)
        program = ps.generate_program_for_issue(test_user["user_id"], analysis_issue.id, db_session)
        assert program.total_drills == 0
        # First range step is still schedulable, just with no drills.
        step = ps.get_next_step(program.id, test_user["user_id"], db_session)
        assert step.session_type == "range"
        assert step.prescription["drill_ids"] == []


# ---------------- get_next_step ----------------

class TestNextStep:
    def test_first_step_is_range_with_two_drills(self, db_session, test_user, seeded):
        analysis_issue, drills = seeded
        program = ps.generate_program_for_issue(test_user["user_id"], analysis_issue.id, db_session)
        step = ps.get_next_step(program.id, test_user["user_id"], db_session)
        assert step.session_type == "range"
        assert step.prescription["num_blocks"] == ps.NUM_DRILLS_PER_RANGE
        picked = {uuid.UUID(d) for d in step.prescription["drill_ids"]}
        assert picked.issubset({d.id for d in drills})
        assert len(picked) == ps.NUM_DRILLS_PER_RANGE

    def test_next_step_is_idempotent_until_completed(self, db_session, test_user, seeded):
        analysis_issue, _ = seeded
        program = ps.generate_program_for_issue(test_user["user_id"], analysis_issue.id, db_session)
        s1 = ps.get_next_step(program.id, test_user["user_id"], db_session)
        s2 = ps.get_next_step(program.id, test_user["user_id"], db_session)
        assert s1.id == s2.id


# ---------------- single-drill issue (NUM_DRILLS_PER_RANGE > available) ----------------

class TestSingleDrillIssue:
    def test_range_step_has_exactly_the_one_drill(self, db_session, test_user):
        analysis_issue, drills = _seed_analysis_issue(db_session, test_user["user_id"], num_drills=1)
        program = ps.generate_program_for_issue(test_user["user_id"], analysis_issue.id, db_session)
        assert program.total_drills == 1

        step = ps.get_next_step(program.id, test_user["user_id"], db_session)
        assert step.session_type == "range"
        assert step.prescription["drill_ids"] == [str(drills[0].id)]
        # num_blocks reflects the drills actually assigned, not NUM_DRILLS_PER_RANGE.
        assert step.prescription["num_blocks"] == 1

    def test_single_drill_grooves_over_repeated_sessions(self, db_session, test_user):
        analysis_issue, drills = _seed_analysis_issue(db_session, test_user["user_id"], num_drills=1)
        program = ps.generate_program_for_issue(test_user["user_id"], analysis_issue.id, db_session)
        only = drills[0].id

        for _ in range(10):
            step = ps.get_next_step(program.id, test_user["user_id"], db_session)
            grades = []
            if step.session_type == "range":
                ids = [uuid.UUID(d) for d in step.prescription["drill_ids"]]
                assert ids == [only]  # always the one drill, never empty or duplicated
                grades = [DrillGradeDTO(drill_id=only, grade="dialed")]
            ps.complete_step(program.id, step.id, test_user["user_id"], grades=grades, practice_session_id=None, session=db_session)

        states = repo.get_drill_states_by_program_id(program.id, db_session)
        assert len(states) == 1
        assert states[0].strength >= ps.GROOVED_THRESHOLD


# ---------------- complete_step ----------------

class TestCompleteStep:
    def test_complete_applies_grades_and_advances(self, db_session, test_user, seeded):
        analysis_issue, _ = seeded
        program = ps.generate_program_for_issue(test_user["user_id"], analysis_issue.id, db_session)
        step = ps.get_next_step(program.id, test_user["user_id"], db_session)
        graded_id = uuid.UUID(step.prescription["drill_ids"][0])

        psess = PracticeSession(user_id=test_user["user_id"], status="completed")
        db_session.add(psess)
        db_session.flush()

        advance = ps.complete_step(
            program.id, step.id, test_user["user_id"],
            grades=[DrillGradeDTO(drill_id=graded_id, grade="dialed")],
            practice_session_id=psess.id, session=db_session,
        )

        assert advance.completed_step.status == "completed"
        assert advance.completed_step.practice_session_id == psess.id
        assert advance.next_step is not None
        states = {s.drill_id: s for s in repo.get_drill_states_by_program_id(program.id, db_session)}
        assert states[graded_id].strength == 1
        assert states[graded_id].last_grade == "dialed"
        assert states[graded_id].times_seen == 1

    def test_complete_unknown_step_raises_not_found(self, db_session, test_user, seeded):
        analysis_issue, _ = seeded
        program = ps.generate_program_for_issue(test_user["user_id"], analysis_issue.id, db_session)
        with pytest.raises(exceptions.NotFoundException):
            ps.complete_step(program.id, uuid.uuid4(), test_user["user_id"], grades=[], practice_session_id=None, session=db_session)

    def test_complete_non_owner_raises_forbidden(self, db_session, test_user, seeded):
        analysis_issue, _ = seeded
        program = ps.generate_program_for_issue(test_user["user_id"], analysis_issue.id, db_session)
        step = ps.get_next_step(program.id, test_user["user_id"], db_session)
        with pytest.raises(exceptions.ForbiddenException):
            ps.complete_step(program.id, step.id, uuid.uuid4(), grades=[], practice_session_id=None, session=db_session)


# ---------------- adaptive loop ----------------

class TestAdaptiveLoop:
    def test_rough_drill_persists_and_dialed_drills_groove(self, db_session, test_user, seeded):
        analysis_issue, drills = seeded
        program = ps.generate_program_for_issue(test_user["user_id"], analysis_issue.id, db_session)
        rough_id = drills[0].id

        rough_appearances = 0
        realized_types = []

        for _ in range(20):
            step = ps.get_next_step(program.id, test_user["user_id"], db_session)
            realized_types.append(step.session_type)
            grades = []
            if step.session_type == "range":
                drill_ids = [uuid.UUID(d) for d in step.prescription["drill_ids"]]
                if rough_id in drill_ids:
                    rough_appearances += 1
                grades = [
                    DrillGradeDTO(drill_id=did, grade="rough" if did == rough_id else "dialed")
                    for did in drill_ids
                ]
            ps.complete_step(program.id, step.id, test_user["user_id"], grades=grades, practice_session_id=None, session=db_session)

        states = {s.drill_id: s for s in repo.get_drill_states_by_program_id(program.id, db_session)}
        # The rough drill never grooves and keeps reappearing.
        assert states[rough_id].strength == 0
        assert rough_appearances >= 5
        # At least one consistently-dialed drill reaches the grooved threshold.
        grooved = [d.id for d in drills if d.id != rough_id and states[d.id].strength >= ps.GROOVED_THRESHOLD]
        assert grooved, states

        # Realized cadence: first three work sessions, retest after RETEST_CADENCE.
        assert realized_types[:3] == ["range", "range", "play"]
        assert realized_types[ps.RETEST_CADENCE] == "retest"
