"""Repository reads and writes the v2 analysis flow is built on.

    get_ranked_issues_for_laws   the issue candidates offered to the AI, per law
    claim_for_processing         awaiting_upload -> processing, exactly once
    fail_if_stale                processing -> failed after the job died
    get_analysis_with_details    everything the details screen shows, flat in queries
"""

import uuid
from datetime import datetime, timedelta, timezone

import pytest

from ....core.infrastructure.db import models
from ....core.infrastructure.db.models.Prompt import Prompt
from ....core.infrastructure.db.repositories.analysis import (
    claim_for_processing,
    fail_if_stale,
    get_analysis_with_details,
)
from ....core.infrastructure.db.repositories.issues import (
    create_issue,
    get_ranked_issues_for_laws,
)
from .test_issue_tag_eager_loading import QueryCounter


def _issue(session, *, area="FULL_SWING", user_id=None) -> models.Issue:
    return create_issue(
        models.Issue(
            title=f"Issue {uuid.uuid4().hex[:8]}",
            description="d",
            area=area,
            user_id=user_id,
            source="custom" if user_id else "catalog",
        ),
        session,
    )


def _with_drill(session, issue: models.Issue) -> models.Issue:
    drill = models.Drill(title="d", task="t", success_signal="s", fault_indicator="f")
    session.add(drill)
    session.flush()
    session.add(models.IssueDrill(issue_id=issue.id, drill_id=drill.id))
    session.flush()
    return issue


def _link(session, issue, law, rank) -> None:
    session.add(models.IssueLaw(issue_id=issue.id, law=law, rank=rank))
    session.flush()


def _analysis(session, user_id, status="awaiting_upload", started_at=None) -> models.Analysis:
    row = models.Analysis(
        user_id=user_id, model_version="test", status=status, started_at=started_at
    )
    session.add(row)
    session.flush()
    return row


@pytest.fixture()
def test_laws(db_session):
    """Two laws of our own, so issues a coach ranked under the real ones never mix in."""
    for key in ("TEST_LAW", "TEST_LAW_2"):
        db_session.add(models.TaxonomyLaw(key=key, label="t", golfer_label="t"))
    db_session.flush()
    return "TEST_LAW", "TEST_LAW_2"


class TestRankedIssuesForLaws:
    def test_returns_issues_law_by_law_in_rank_order(self, db_session, test_user, test_laws):
        law, law_2 = test_laws
        second, first, other_law = _issue(db_session), _issue(db_session), _issue(db_session)
        _link(db_session, second, law, 2)
        _link(db_session, first, law, 1)
        _link(db_session, other_law, law_2, 1)

        rows = get_ranked_issues_for_laws([law, law_2], "FULL_SWING", test_user["user_id"], db_session)

        assert [(r.law, r.rank, r.issue_id) for r in rows] == [
            (law, 1, first.id),
            (law, 2, second.id),
            (law_2, 1, other_law.id),
        ]

    def test_leaves_out_laws_not_asked_for(self, db_session, test_user, test_laws):
        law, law_2 = test_laws
        _link(db_session, _issue(db_session), law_2, 1)

        assert get_ranked_issues_for_laws([law], "FULL_SWING", test_user["user_id"], db_session) == []

    def test_leaves_out_issues_from_another_area(self, db_session, test_user, test_laws):
        law, _ = test_laws
        _link(db_session, _issue(db_session, area="PUTTING"), law, 1)

        assert get_ranked_issues_for_laws([law], "FULL_SWING", test_user["user_id"], db_session) == []

    def test_includes_own_custom_issues_but_not_another_users(
        self, db_session, test_user, disposable_user, test_laws
    ):
        law, _ = test_laws
        own = _issue(db_session, user_id=test_user["user_id"])
        someone_elses = _issue(db_session, user_id=disposable_user["user_id"])
        _link(db_session, own, law, 1)
        _link(db_session, someone_elses, law, 2)

        rows = get_ranked_issues_for_laws([law], "FULL_SWING", test_user["user_id"], db_session)

        assert [r.issue_id for r in rows] == [own.id]

    def test_no_laws_returns_empty_without_querying(self, db_session, test_user):
        with QueryCounter(db_session) as counter:
            assert get_ranked_issues_for_laws([], "FULL_SWING", test_user["user_id"], db_session) == []
        assert counter.count == 0

    def test_issues_and_drills_are_loaded_up_front(self, db_session, test_user, test_laws):
        """The analysis walks every candidate's drills. A lazy load there would be a
        query per issue."""
        law, _ = test_laws
        for rank in (1, 2, 3):
            _link(db_session, _with_drill(db_session, _issue(db_session)), law, rank)
        db_session.expunge_all()

        rows = get_ranked_issues_for_laws([law], "FULL_SWING", test_user["user_id"], db_session)
        with QueryCounter(db_session) as counter:
            drills = [link.drill.title for r in rows for link in r.issue.issue_drills]

        assert len(drills) == 3
        assert counter.count == 0, f"Lazy loads:\n{counter.explain()}"


class TestClaimForProcessing:
    def test_claims_an_analysis_awaiting_upload(self, db_session, test_user):
        analysis = _analysis(db_session, test_user["user_id"])

        assert claim_for_processing(analysis.id, db_session) is True

        db_session.refresh(analysis)
        assert analysis.status == "processing"
        assert analysis.started_at is not None

    def test_second_claim_loses(self, db_session, test_user):
        """A double tap or a client retry must not start the job twice."""
        analysis = _analysis(db_session, test_user["user_id"])
        claim_for_processing(analysis.id, db_session)

        assert claim_for_processing(analysis.id, db_session) is False

    @pytest.mark.parametrize("status", ["processing", "completed", "failed"])
    def test_only_awaiting_upload_can_be_claimed(self, db_session, test_user, status):
        analysis = _analysis(db_session, test_user["user_id"], status=status)

        assert claim_for_processing(analysis.id, db_session) is False

        db_session.refresh(analysis)
        assert analysis.status == status

    def test_unknown_analysis_is_not_claimed(self, db_session):
        assert claim_for_processing(uuid.uuid4(), db_session) is False


class TestFailIfStale:
    LIMIT = timedelta(minutes=10)

    def test_fails_an_analysis_processing_past_the_limit(self, db_session, test_user):
        started = datetime.now(timezone.utc) - timedelta(minutes=11)
        analysis = _analysis(db_session, test_user["user_id"], "processing", started)

        assert fail_if_stale(analysis.id, self.LIMIT, db_session) is True

        db_session.refresh(analysis)
        assert (analysis.status, analysis.success) == ("failed", False)
        assert analysis.error_message

    def test_leaves_a_recent_analysis_alone(self, db_session, test_user):
        started = datetime.now(timezone.utc) - timedelta(minutes=1)
        analysis = _analysis(db_session, test_user["user_id"], "processing", started)

        assert fail_if_stale(analysis.id, self.LIMIT, db_session) is False

        db_session.refresh(analysis)
        assert analysis.status == "processing"

    @pytest.mark.parametrize("status", ["awaiting_upload", "completed", "failed"])
    def test_only_touches_processing(self, db_session, test_user, status):
        """A finished job must never be overwritten, however old."""
        started = datetime.now(timezone.utc) - timedelta(hours=1)
        analysis = _analysis(db_session, test_user["user_id"], status, started)

        assert fail_if_stale(analysis.id, self.LIMIT, db_session) is False

        db_session.refresh(analysis)
        assert analysis.status == status


class TestAnalysisWithDetails:
    def _completed_with_issues(self, session, user_id, n: int) -> models.Analysis:
        analysis = _analysis(session, user_id, status="completed")
        analysis.law = "FACE"
        session.add(Prompt(analysis_id=analysis.id, area="FULL_SWING", miss="SLICE", notes="n"))
        for i in range(n):
            issue = _with_drill(session, _issue(session))
            session.add(models.AnalysisIssue(analysis_id=analysis.id, issue_id=issue.id, confidence=0.5 + i / 10))
        session.flush()
        return analysis

    def test_loads_prompt_issues_and_drills(self, db_session, test_user):
        analysis = self._completed_with_issues(db_session, test_user["user_id"], 2)
        db_session.expunge_all()

        loaded = get_analysis_with_details(analysis.id, db_session)
        with QueryCounter(db_session) as counter:
            summary = (
                loaded.law,
                loaded.prompt.miss,
                sorted(len(ai.issue.issue_drills) for ai in loaded.issues),
                [link.drill.title for ai in loaded.issues for link in ai.issue.issue_drills],
            )

        assert summary[:3] == ("FACE", "SLICE", [1, 1])
        assert counter.count == 0, f"Lazy loads:\n{counter.explain()}"

    def test_query_count_does_not_grow_with_issue_count(self, db_session, test_user):
        one = self._completed_with_issues(db_session, test_user["user_id"], 1)
        three = self._completed_with_issues(db_session, test_user["user_id"], 3)
        db_session.expunge_all()

        with QueryCounter(db_session) as small:
            get_analysis_with_details(one.id, db_session)
        db_session.expunge_all()
        with QueryCounter(db_session) as large:
            get_analysis_with_details(three.id, db_session)

        assert small.count == large.count, (
            f"{small.count} queries for 1 issue, {large.count} for 3: that is an N+1."
        )

    def test_unknown_analysis_returns_none(self, db_session):
        assert get_analysis_with_details(uuid.uuid4(), db_session) is None
