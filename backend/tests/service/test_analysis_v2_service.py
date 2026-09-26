"""The v2 analysis service: create, start, the background run, status and details.

R2, ffmpeg, Gemini and the subscription check are stubbed. The background job runs for
real against the test's own connection, through a session that commits to a savepoint,
so its commits are rolled back with the test like everything else.
"""

import uuid
from contextlib import ExitStack
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest

from core.infrastructure import ai
from core.infrastructure.db import models
from core.infrastructure.db.models.Prompt import Prompt
from core.infrastructure.db.repositories.issues import create_issue
from core.infrastructure.db.session import SessionLocal
from core.services import analysis_v2_service as svc
from core.services import taxonomy
from core.services.dtos.analysis_v2_dto import CreateAnalysisV2DTO
from core.services.exceptions import (
    ConflictException,
    ForbiddenException,
    ValidationException,
)


# ------------------------------ fixtures ------------------------------


@pytest.fixture()
def vocab(db_session):
    """TEST_AREA / TEST_MISS -> TEST_LAW, so authored links on real terms never mix in."""
    db_session.add(models.TaxonomyArea(key="TEST_AREA", label="t", golfer_label="t"))
    db_session.flush()
    db_session.add(models.TaxonomyMiss(key="TEST_MISS", area="TEST_AREA", label="t", golfer_label="t"))
    db_session.add(models.TaxonomyLaw(key="TEST_LAW", label="Test law", golfer_label="t"))
    db_session.flush()
    db_session.add(models.TaxonomyMissLaw(miss="TEST_MISS", law="TEST_LAW", rank=1))
    db_session.flush()
    taxonomy.prime_from(db_session)


def _issue_under_test_law(session, rank, *, with_drill=True) -> models.Issue:
    issue = create_issue(
        models.Issue(title=f"Issue {uuid.uuid4().hex[:8]}", description="d", area="TEST_AREA"),
        session,
    )
    session.add(models.IssueLaw(issue_id=issue.id, law="TEST_LAW", rank=rank))
    if with_drill:
        drill = models.Drill(title="Pump drill", task="t", success_signal="s", fault_indicator="f")
        session.add(drill)
        session.flush()
        session.add(models.IssueDrill(issue_id=issue.id, drill_id=drill.id))
    session.flush()
    return issue


def _analysis(session, user_id, *, status="processing", area="TEST_AREA", miss="TEST_MISS",
              started_at=None, **prompt_fields) -> models.Analysis:
    video = models.Video(user_id=user_id, video_key=f"videos/{uuid.uuid4()}", thumbnail_key="thumbnails/x.jpg")
    session.add(video)
    session.flush()
    analysis = models.Analysis(
        user_id=user_id, video_id=video.id, model_version="test-model", status=status,
        started_at=started_at or datetime.now(timezone.utc),
    )
    session.add(analysis)
    session.flush()
    session.add(Prompt(analysis_id=analysis.id, area=area, miss=miss, **prompt_fields))
    session.flush()
    return analysis


@pytest.fixture()
def run_job(db_session):
    """Run execute_analysis on the test's connection, with the outside world stubbed.

    Returns a function taking what the fake Gemini answers (a dict, or an exception to
    raise) and returning the analyze_swing mock so tests can inspect the call.
    """
    def factory():
        return SessionLocal(bind=db_session.get_bind(), join_transaction_mode="create_savepoint")

    def run(analysis_id, answer=None, *, subscribed=True, thumbnail_error=None):
        with ExitStack() as stack:
            stack.enter_context(patch.object(svc, "get_object", return_value=b"video-bytes"))
            put = stack.enter_context(patch.object(svc, "put_object"))
            stack.enter_context(patch.object(
                svc, "make_thumbnail_jpeg",
                side_effect=thumbnail_error, return_value=b"jpeg",
            ))
            stack.enter_context(patch.object(
                svc.entitlement_service, "is_subscribed", return_value=subscribed,
            ))
            analyze = stack.enter_context(patch.object(ai, "analyze_swing"))
            if isinstance(answer, Exception):
                analyze.side_effect = answer
            else:
                analyze.return_value = answer
            svc.execute_analysis(analysis_id, session_factory=factory)
        db_session.expire_all()
        analyze.put = put
        return analyze

    return run


def _answer(law="TEST_LAW", issues=(), **extra):
    return {"observation": "o", "success": True, "law": law,
            "issues": [{"issue_id": str(i), "confidence": c} for i, c in issues], **extra}


# ------------------------------ create ------------------------------


class TestCreateAnalysisV2:
    def _create(self, db_session, user_id, **fields):
        dto = CreateAnalysisV2DTO(user_id=user_id, **{"area": "FULL_SWING", "miss": "SLICE", **fields})
        with patch.object(svc, "generate_upload_url", return_value="https://upload") as url:
            created = svc.create_analysis_v2(dto, db_session)
        return created, url

    def test_creates_the_rows_and_returns_an_upload_url(self, db_session, test_user):
        created, url = self._create(
            db_session, test_user["user_id"],
            area="full_swing", miss="slice", notes="  driver only ", club_type="driver", camera_view="Face_On",
        )

        analysis = db_session.get(models.Analysis, created.analysis_id)
        prompt = analysis.prompt
        assert created.upload_url == "https://upload"
        assert (analysis.status, analysis.model_version) == ("awaiting_upload", ai.get_model())
        assert (prompt.area, prompt.miss, prompt.notes, prompt.club_type, prompt.camera_view) == (
            "FULL_SWING", "SLICE", "driver only", "driver", "face_on",
        )
        assert analysis.video.video_key == f"videos/{analysis.video_id}"
        url.assert_called_once_with(key=f"videos/{analysis.video_id}")

    def test_blank_optional_inputs_are_stored_as_null(self, db_session, test_user):
        created, _ = self._create(db_session, test_user["user_id"], notes="   ", club_type="", camera_view=None)

        prompt = db_session.get(models.Analysis, created.analysis_id).prompt
        assert (prompt.notes, prompt.club_type, prompt.camera_view) == (None, None, None)

    @pytest.mark.parametrize("fields", [
        {"area": "NOT_AN_AREA"},
        {"miss": "NOT_A_MISS"},
        {"miss": ""},
        {"area": "PUTTING", "miss": "SLICE"},
        {"camera_view": "behind"},
        {"notes": "x" * (svc.MAX_NOTES_LENGTH + 1)},
        {"club_type": "x" * (svc.MAX_CLUB_TYPE_LENGTH + 1)},
    ])
    def test_invalid_input_is_refused_before_anything_is_written(self, db_session, test_user, fields):
        before = db_session.query(models.Analysis).filter_by(user_id=test_user["user_id"]).count()

        with pytest.raises(ValidationException):
            self._create(db_session, test_user["user_id"], **fields)

        assert db_session.query(models.Analysis).filter_by(user_id=test_user["user_id"]).count() == before


# ------------------------------ start ------------------------------


class TestStartAnalysis:
    def _start(self, db_session, analysis, user_id, uploaded=True):
        with patch.object(svc, "object_exists", return_value=uploaded):
            svc.start_analysis(analysis.id, user_id, db_session)

    def test_claims_an_uploaded_analysis(self, db_session, test_user, vocab):
        analysis = _analysis(db_session, test_user["user_id"], status="awaiting_upload")

        self._start(db_session, analysis, test_user["user_id"])

        db_session.refresh(analysis)
        assert analysis.status == "processing"

    def test_not_uploaded_yet_is_a_conflict(self, db_session, test_user, vocab):
        analysis = _analysis(db_session, test_user["user_id"], status="awaiting_upload")

        with pytest.raises(ConflictException, match="not been uploaded"):
            self._start(db_session, analysis, test_user["user_id"], uploaded=False)

        db_session.refresh(analysis)
        assert analysis.status == "awaiting_upload"

    @pytest.mark.parametrize("status", ["processing", "completed", "failed"])
    def test_only_awaiting_upload_can_start(self, db_session, test_user, vocab, status):
        analysis = _analysis(db_session, test_user["user_id"], status=status)

        with pytest.raises(ConflictException):
            self._start(db_session, analysis, test_user["user_id"])

    def test_v1_analysis_cannot_be_started_here(self, db_session, test_user):
        analysis = _analysis(db_session, test_user["user_id"], status="awaiting_upload", area=None, miss=None)

        with pytest.raises(ConflictException, match="v2"):
            self._start(db_session, analysis, test_user["user_id"])

    def test_someone_elses_analysis_is_forbidden(self, db_session, test_user, disposable_user, vocab):
        analysis = _analysis(db_session, disposable_user["user_id"], status="awaiting_upload")

        with pytest.raises(ForbiddenException):
            self._start(db_session, analysis, test_user["user_id"])


# ------------------------------ execute ------------------------------


class TestExecuteAnalysis:
    def test_success_saves_the_law_and_issues(self, db_session, test_user, vocab, run_job):
        first, second = _issue_under_test_law(db_session, 1), _issue_under_test_law(db_session, 2)
        analysis = _analysis(db_session, test_user["user_id"])

        run_job(analysis.id, _answer(issues=[(first.id, 0.6), (second.id, 0.9)]))

        analysis = db_session.get(models.Analysis, analysis.id)
        assert (analysis.status, analysis.success, analysis.law) == ("completed", True, "TEST_LAW")
        assert analysis.completed_at is not None
        assert {(i.issue_id, i.confidence) for i in analysis.issues} == {(first.id, 0.6), (second.id, 0.9)}

    def test_sends_the_candidates_and_golfers_inputs_to_the_ai(self, db_session, test_user, vocab, run_job):
        issue = _issue_under_test_law(db_session, 1)
        analysis = _analysis(db_session, test_user["user_id"], notes="driver only",
                             club_type="driver", camera_view="face_on")

        analyze = run_job(analysis.id, _answer())

        kwargs = analyze.call_args.kwargs
        context = kwargs["context"]
        assert kwargs["model"] == "test-model"
        assert kwargs["video_path"].endswith("swing.mp4")
        assert (context["area"], context["miss"], context["notes"]) == ("TEST_AREA", "TEST_MISS", "driver only")
        assert (context["club_type"], context["camera_view"]) == ("driver", "face_on")
        assert [law["key"] for law in context["laws"]] == ["TEST_LAW"]
        assert context["laws"][0]["issues"][0]["issue_id"] == str(issue.id)

    def test_no_valid_issue_still_completes_with_the_law(self, db_session, test_user, vocab, run_job):
        _issue_under_test_law(db_session, 1)
        analysis = _analysis(db_session, test_user["user_id"])

        run_job(analysis.id, _answer(issues=[(uuid.uuid4(), 0.9)]))

        analysis = db_session.get(models.Analysis, analysis.id)
        assert (analysis.status, analysis.law, analysis.issues) == ("completed", "TEST_LAW", [])

    def test_thumbnail_failure_does_not_fail_the_analysis(self, db_session, test_user, vocab, run_job):
        _issue_under_test_law(db_session, 1)
        analysis = _analysis(db_session, test_user["user_id"])

        run_job(analysis.id, _answer(), thumbnail_error=RuntimeError("ffmpeg"))

        assert db_session.get(models.Analysis, analysis.id).status == "completed"

    @pytest.mark.parametrize("answer, message", [
        (ai.AIVideoRejected("Gemini could not process the video."), "could not process"),
        ({"success": False, "error_message": "Not a golf swing"}, "Not a golf swing"),
        (_answer(law="SPEED"), "not one of"),
        (RuntimeError("connection reset by peer at 10.0.0.3"), "Please try again"),
    ])
    def test_failure_is_recorded_with_a_message_and_no_issues(
        self, db_session, test_user, vocab, run_job, answer, message
    ):
        issue = _issue_under_test_law(db_session, 1)
        analysis = _analysis(db_session, test_user["user_id"])
        if isinstance(answer, dict) and answer.get("success"):
            answer["issues"] = [{"issue_id": str(issue.id), "confidence": 0.9}]

        run_job(analysis.id, answer)

        analysis = db_session.get(models.Analysis, analysis.id)
        assert (analysis.status, analysis.success) == ("failed", False)
        assert message in analysis.error_message
        assert analysis.issues == []
        assert analysis.law is None

    def test_internal_errors_do_not_reach_the_client(self, db_session, test_user, vocab, run_job):
        _issue_under_test_law(db_session, 1)
        analysis = _analysis(db_session, test_user["user_id"])

        run_job(analysis.id, RuntimeError("connection reset by peer at 10.0.0.3"))

        assert "10.0.0.3" not in db_session.get(models.Analysis, analysis.id).error_message

    def test_lapsed_subscription_fails_and_saves_nothing(self, db_session, test_user, vocab, run_job):
        issue = _issue_under_test_law(db_session, 1)
        analysis = _analysis(db_session, test_user["user_id"])

        run_job(analysis.id, _answer(issues=[(issue.id, 0.9)]), subscribed=False)

        analysis = db_session.get(models.Analysis, analysis.id)
        assert analysis.status == "failed"
        assert "Subscription" in analysis.error_message
        assert (analysis.law, analysis.issues) == (None, [])

    def test_nothing_to_analyze_against_fails_without_calling_the_ai(self, db_session, test_user, vocab, run_job):
        analysis = _analysis(db_session, test_user["user_id"])

        analyze = run_job(analysis.id, _answer())

        analyze.assert_not_called()
        assert db_session.get(models.Analysis, analysis.id).status == "failed"

    @pytest.mark.parametrize("status", ["awaiting_upload", "completed", "failed"])
    def test_only_a_processing_analysis_is_run(self, db_session, test_user, vocab, run_job, status):
        _issue_under_test_law(db_session, 1)
        analysis = _analysis(db_session, test_user["user_id"], status=status)

        analyze = run_job(analysis.id, _answer())

        analyze.assert_not_called()
        assert db_session.get(models.Analysis, analysis.id).status == status

    def test_unknown_analysis_does_nothing(self, run_job):
        analyze = run_job(uuid.uuid4(), _answer())

        analyze.assert_not_called()


# ------------------------------ status ------------------------------


class TestGetAnalysisStatus:
    def test_returns_the_status(self, db_session, test_user, vocab):
        analysis = _analysis(db_session, test_user["user_id"], status="awaiting_upload")

        status = svc.get_analysis_status(analysis.id, test_user["user_id"], db_session)

        assert (status.analysis_id, status.status, status.error_message) == (analysis.id, "awaiting_upload", None)

    def test_a_dead_job_is_reported_failed(self, db_session, test_user, vocab):
        started = datetime.now(timezone.utc) - svc.STALE_AFTER - timedelta(minutes=1)
        analysis = _analysis(db_session, test_user["user_id"], started_at=started)

        status = svc.get_analysis_status(analysis.id, test_user["user_id"], db_session)

        assert status.status == "failed"
        assert status.error_message

    def test_a_running_job_stays_processing(self, db_session, test_user, vocab):
        analysis = _analysis(db_session, test_user["user_id"])

        assert svc.get_analysis_status(analysis.id, test_user["user_id"], db_session).status == "processing"

    def test_someone_elses_analysis_is_forbidden(self, db_session, test_user, disposable_user, vocab):
        analysis = _analysis(db_session, disposable_user["user_id"])

        with pytest.raises(ForbiddenException):
            svc.get_analysis_status(analysis.id, test_user["user_id"], db_session)


# ------------------------------ details ------------------------------


class TestGetAnalysisDetails:
    def test_returns_the_result_highest_confidence_first(self, db_session, test_user, vocab, run_job):
        low, high = _issue_under_test_law(db_session, 1), _issue_under_test_law(db_session, 2)
        analysis = _analysis(db_session, test_user["user_id"], notes="n", club_type="driver", camera_view="face_on")
        run_job(analysis.id, _answer(issues=[(low.id, 0.6), (high.id, 0.9)]))

        details = svc.get_analysis_details(analysis.id, test_user["user_id"], db_session)

        assert (details.status, details.law, details.area, details.miss) == ("completed", "TEST_LAW", "TEST_AREA", "TEST_MISS")
        assert (details.notes, details.club_type, details.camera_view) == ("n", "driver", "face_on")
        assert [(i.issue_id, i.confidence) for i in details.issues] == [(high.id, 0.9), (low.id, 0.6)]
        assert [d.title for d in details.issues[0].drills] == ["Pump drill"]

    def test_dismissed_issues_are_left_out(self, db_session, test_user, vocab, run_job):
        kept, dismissed = _issue_under_test_law(db_session, 1), _issue_under_test_law(db_session, 2)
        analysis = _analysis(db_session, test_user["user_id"])
        run_job(analysis.id, _answer(issues=[(kept.id, 0.6), (dismissed.id, 0.9)]))
        for row in db_session.get(models.Analysis, analysis.id).issues:
            row.active = row.issue_id != dismissed.id
        db_session.flush()

        details = svc.get_analysis_details(analysis.id, test_user["user_id"], db_session)

        assert [i.issue_id for i in details.issues] == [kept.id]

    @pytest.mark.parametrize("status", ["awaiting_upload", "processing", "failed"])
    def test_not_completed_is_a_conflict(self, db_session, test_user, vocab, status):
        analysis = _analysis(db_session, test_user["user_id"], status=status)

        with pytest.raises(ConflictException):
            svc.get_analysis_details(analysis.id, test_user["user_id"], db_session)

    def test_someone_elses_analysis_is_forbidden(self, db_session, test_user, disposable_user, vocab):
        analysis = _analysis(db_session, disposable_user["user_id"], status="completed")

        with pytest.raises(ForbiddenException):
            svc.get_analysis_details(analysis.id, test_user["user_id"], db_session)
