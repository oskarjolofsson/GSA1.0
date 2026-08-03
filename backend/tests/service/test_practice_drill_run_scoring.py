"""Recording a scored drill run, and the FK repair that came with it.

Covers the parts of Slice B that only fail against a real database: the columns actually
persist, the mismatch guard fires, and deleting a practised drill no longer explodes.
"""


import pytest

from core.infrastructure.db.models import Drill, PracticeDrillRun, PracticeSession
from core.services import exceptions, practice_session_service
from core.services.dtos.practice_session_service_dto import CompleteDrillRunDTO

MAKE_RATE_10 = {"type": "make_rate", "reps": 10, "grade_at": {"dialed": 0.8, "ok": 0.5}}


def _drill(db, metric=None, area=None, title="Ten six-footers"):
    drill = Drill(
        title=title,
        task="t",
        success_signal="s",
        fault_indicator="f",
        metric=metric,
        area=area,
    )
    db.add(drill)
    db.flush()
    return drill


def _run(db, drill, user_id):
    session = PracticeSession(user_id=user_id, status="in_progress")
    db.add(session)
    db.flush()
    run = PracticeDrillRun(session_id=session.id, drill_id=drill.id, order_index=0)
    db.add(run)
    db.flush()
    return run


def _complete(db, run, **kw):
    return practice_session_service.record_drill_run_completion(
        CompleteDrillRunDTO(
            drill_run_id=run.id,
            successful_reps=kw.pop("successful_reps", 0),
            failed_reps=0,
            skipped=False,
            **kw,
        ),
        db,
    )


class TestRecordingAScore:
    def test_stores_the_raw_value_and_grades_it_on_the_way_out(self, db_session, test_user):
        drill = _drill(db_session, metric=MAKE_RATE_10)
        run = _run(db_session, drill, test_user["user_id"])

        result = _complete(db_session, run, metric_value=8)

        assert result.metric_value == 8
        assert result.grade == "dialed"
        # The type is stamped from the drill so the number stays readable after a retune.
        assert result.metric_type == "make_rate"

    def test_the_grade_is_derived_not_stored(self, db_session, test_user):
        # Retuning the drill re-reads history through the new thresholds. This is the
        # payoff for deriving server-side instead of trusting the client's grade.
        drill = _drill(db_session, metric=MAKE_RATE_10)
        run = _run(db_session, drill, test_user["user_id"])
        _complete(db_session, run, metric_value=8)

        drill.metric = {**MAKE_RATE_10, "grade_at": {"dialed": 0.9, "ok": 0.7}}
        db_session.flush()

        results = practice_session_service.get_practice_session_results(
            run.session_id, db_session
        )
        assert results[0].metric_value == 8
        assert results[0].grade == "ok"

    def test_feel_lands_in_its_own_column(self, db_session, test_user):
        # Not successful_reps, which is frozen and named for something else entirely.
        drill = _drill(db_session)
        run = _run(db_session, drill, test_user["user_id"])

        result = _complete(db_session, run, feel=3)

        assert result.feel == 3
        assert result.grade is None

    def test_a_metric_drill_still_accepts_a_bare_feel(self, db_session, test_user):
        # What an older build without the counting UI sends. It has to keep working --
        # that is the whole point of B2's default branch.
        drill = _drill(db_session, metric=MAKE_RATE_10)
        run = _run(db_session, drill, test_user["user_id"])

        result = _complete(db_session, run, feel=2)

        assert result.feel == 2
        assert result.metric_value is None

    def test_refuses_a_score_for_a_feel_only_drill(self, db_session, test_user):
        # There are no thresholds to grade it against, so the number would be stored as
        # something nothing can ever interpret.
        drill = _drill(db_session, title="Mirror work")
        run = _run(db_session, drill, test_user["user_id"])

        with pytest.raises(exceptions.ValidationException) as err:
            _complete(db_session, run, metric_value=8)
        assert "Mirror work" in str(err.value)


class TestDeletingAPractisedDrill:
    def test_the_run_outlives_its_drill(self, db_session, test_user):
        """PracticeDrillRun.drill_id declared ondelete=SET NULL on a NOT NULL column, so
        this raised a not-null violation instead of doing what the FK said. The run has to
        survive: it is a session the golfer actually did, and it counts toward the streak
        and the graph."""
        drill = _drill(db_session)
        run = _run(db_session, drill, test_user["user_id"])
        run_id = run.id

        db_session.delete(drill)
        db_session.flush()
        # Postgres nulls the column; SQLAlchemy's identity map does not know that, so the
        # in-memory copy still holds the old id until it is expired.
        db_session.expire_all()

        survivor = db_session.get(PracticeDrillRun, run_id)
        assert survivor is not None
        assert survivor.drill_id is None

    def test_results_render_an_orphaned_run_without_a_title(self, db_session, test_user):
        drill = _drill(db_session)
        run = _run(db_session, drill, test_user["user_id"])
        _complete(db_session, run, feel=2)

        db_session.delete(drill)
        db_session.flush()

        results = practice_session_service.get_practice_session_results(
            run.session_id, db_session
        )
        assert [r.drill_title for r in results] == ["Unknown Drill"]


class TestTheFrozenColumn:
    """`successful_reps` is frozen: the server owns it, mirrored from `feel`.

    The column never held a rep count. It carried the rough/ok/dialed ordinal because
    that shipped before there was a `feel` column to put it in. Freezing it means two
    things at once — a current client stops sending it, and builds in the wild that
    still read it keep seeing a coherent number.
    """

    def test_mirrors_feel_rather_than_the_request(self, db_session, test_user):
        drill = _drill(db_session)
        run = _run(db_session, drill, test_user["user_id"])

        # A current client sends 0 and lets the server decide.
        _complete(db_session, run, feel=3, successful_reps=0)

        assert run.feel == 3
        assert run.successful_reps == 3

    def test_a_scored_block_leaves_it_at_zero(self, db_session, test_user):
        drill = _drill(db_session, metric=MAKE_RATE_10)
        run = _run(db_session, drill, test_user["user_id"])

        _complete(db_session, run, metric_value=8)

        # 8 putts made is not a feel, and writing it here would read back as "dialed"
        # on any build that still interprets this column as an ordinal.
        assert run.feel is None
        assert run.successful_reps == 0

    def test_a_pre_feel_client_is_translated_not_dropped(self, db_session, test_user):
        """Builds shipped before `feel` existed send only the ordinal, in this column.
        Reading it back into `feel` is the difference between their sessions landing
        somewhere honest and landing nowhere."""
        drill = _drill(db_session)
        run = _run(db_session, drill, test_user["user_id"])

        _complete(db_session, run, successful_reps=2)

        assert run.feel == 2

    def test_an_out_of_range_legacy_value_is_not_mistaken_for_a_feel(self, db_session, test_user):
        drill = _drill(db_session)
        run = _run(db_session, drill, test_user["user_id"])

        _complete(db_session, run, successful_reps=7)

        assert run.feel is None
        assert run.successful_reps == 0
