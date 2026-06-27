import uuid
import pytest

from core.infrastructure.db.models.Program import Program
from core.infrastructure.db.models.ProgramStep import ProgramStep
from core.infrastructure.db.models.ProgramDrillState import ProgramDrillState
from core.infrastructure.db.models.Drill import Drill
from core.infrastructure.db.repositories import programs as repo
from core.infrastructure.db.repositories.drills import create_drill


@pytest.fixture
def make_drill(db_session) -> Drill:
    def _make(title="Drill"):
        return create_drill(
            Drill(title=title, task="t", success_signal="s", fault_indicator="f"),
            db_session,
        )
    return _make


@pytest.fixture
def program(db_session, test_user):
    p = Program(user_id=test_user["user_id"], analysis_issue_id=None, title="Fix X", status="active")
    return repo.create_program(p, db_session)

class TestProgramCrud:
    def test_create_and_get_program(self, db_session, program):
        """
        Tests so that get_program_by_id returns the correct program object
        """
        
        assert program.id is not None
        assert repo.get_program_by_id(program.id, db_session).id == program.id

    def test_get_active_programs_by_user_excludes_completed(self, db_session, test_user):
        """
        Creates two programs for one user, one active and one completed
        Tests that get_active_programs_by_user only returns the active one
        """
        
        active = repo.create_program(
            Program(user_id=test_user["user_id"], analysis_issue_id=None, title="A", status="active"),
            db_session,
        )
        
        completed = repo.create_program(
            Program(user_id=test_user["user_id"], analysis_issue_id=None, title="Done", status="completed"),
            db_session,
        )
        ids = [p.id for p in repo.get_active_programs_by_user(test_user["user_id"], db_session)]
        assert active.id in ids
        assert completed.id not in ids

    def test_update_program(self, db_session, program):
        """
        Creates a program
        Updates the program's status to completed
        Tests that get_program_by_id returns the updated program object
        """
        
        program.status = "completed"
        repo.update_program(program, db_session)
        assert repo.get_program_by_id(program.id, db_session).status == "completed"


class TestProgramSteps:
    def test_pending_and_completed_steps(self, db_session, program):
        """
        Creates two steps for a program, one completed and one pending
        Tests that get_pending_step returns the pending step
        Tests that get_completed_steps returns the completed step
        """
        
        s0 = repo.create_step(
            ProgramStep(program_id=program.id, order_index=0, session_type="range", prescription={}, status="completed"),
            db_session,
        )
        s1 = repo.create_step(
            ProgramStep(program_id=program.id, order_index=1, session_type="play", prescription={}, status="pending"),
            db_session,
        )
        assert repo.get_pending_step(program.id, db_session).id == s1.id
        completed_ids = [s.id for s in repo.get_completed_steps(program.id, db_session)]
        assert completed_ids == [s0.id]

    def test_update_step(self, db_session, program):
        """
        Creates a step for a program
        Updates the step's status to completed
        Tests that get_pending_step returns None
        """
        step = repo.create_step(
            ProgramStep(program_id=program.id, order_index=0, session_type="play", prescription={}, status="pending"),
            db_session,
        )
        step.status = "completed"
        repo.update_step(step, db_session)
        assert repo.get_pending_step(program.id, db_session) is None


class TestProgramDrillStates:
    def test_create_and_get_states(self, db_session, program, make_drill):
        """
        Creates two drills and two drill states for a program
        Tests that get_drill_states_by_program_id returns both drill states
        """
        d1, d2 = make_drill("a"), make_drill("b")
        repo.create_drill_states(
            [
                ProgramDrillState(program_id=program.id, drill_id=d1.id, strength=0),
                ProgramDrillState(program_id=program.id, drill_id=d2.id, strength=2),
            ],
            db_session,
        )
        states = repo.get_drill_states_by_program_id(program.id, db_session)
        assert {s.drill_id for s in states} == {d1.id, d2.id}

    def test_update_drill_state(self, db_session, program, make_drill):
        """
        Creates a drill and a drill state for a program
        Updates the drill state's strength
        Tests that get_drill_states_by_program_id returns the updated drill state
        """
        
        d = make_drill()
        state = repo.create_drill_states(
            [ProgramDrillState(program_id=program.id, drill_id=d.id, strength=0)], db_session
        )[0]
        state.strength = 3
        repo.update_drill_state(state, db_session)
        refreshed = repo.get_drill_states_by_program_id(program.id, db_session)[0]
        assert refreshed.strength == 3

    def test_unique_program_drill_constraint(self, db_session, program, make_drill):
        """
        Creates a drill and a drill state for a program
        Tests that creating another drill state for the same program and drill raises an exception
        """
        d = make_drill()
        repo.create_drill_states(
            [ProgramDrillState(program_id=program.id, drill_id=d.id, strength=0)], db_session
        )
        with pytest.raises(Exception):
            repo.create_drill_states(
                [ProgramDrillState(program_id=program.id, drill_id=d.id, strength=1)], db_session
            )
