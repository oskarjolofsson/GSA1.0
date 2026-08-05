"""Stamping a practice session with the part of the game it was (C2).

The graph colours squares by area, and a session has to carry one to be coloured. The
column is stored rather than joined because there is nothing to join through:
`program_step_id` is never written by any code, and `analysis_issue_id` is NULL for every
session started from the library — which is exactly where the short game lives.

Nothing here asserts on a hardcoded area name beyond what the fixture itself set, because
the service reads `issues.area` and knows no area names of its own.
"""

from core.infrastructure.db import models
from core.infrastructure.db.repositories import practice_sessions as repo
from core.services import practice_session_service as svc


def _issue(db, area, title="Chunked chips", source="catalog"):
    issue = models.Issue(title=title, description="d", area=area, kind="fault", source=source)
    db.add(issue)
    db.flush()
    return issue


def _analysis_issue(db, issue, user_id):
    """An AI-found issue: the only path that has an AnalysisIssue at all."""
    video = models.Video(user_id=user_id, video_key="v/key.mp4")
    db.add(video)
    db.flush()
    analysis = models.Analysis(user_id=user_id, video_id=video.id, model_version="test")
    db.add(analysis)
    db.flush()
    analysis_issue = models.AnalysisIssue(analysis_id=analysis.id, issue_id=issue.id)
    db.add(analysis_issue)
    db.flush()
    return analysis_issue


def _start(db, user_id, **kw):
    dto = svc.record_practice_session_start(
        user_id=user_id,
        analysis_issue_id=kw.pop("analysis_issue_id", None),
        session=db,
        **kw,
    )
    return repo.get_practice_session_by_id(dto.id, db)


class TestAreaFromTheIssue:
    def test_reads_whatever_the_issue_says(self, db_session, test_user):
        issue = _issue(db_session, "PUTTING")

        row = _start(db_session, test_user["user_id"], issue_id=issue.id)

        assert row.area == "PUTTING"

    def test_a_library_issue_with_no_analysis_still_gets_an_area(self, db_session, test_user):
        """The case a join could never have covered, and the reason this column exists.

        Browse-started and custom issues have no AnalysisIssue row, so the only path from
        a session to an area is the issue id the client sends. Without it every short-game
        session — all of which are authored, not AI-found — would be invisible on the graph.
        """
        issue = _issue(db_session, "BUNKER", source="catalog")

        row = _start(db_session, test_user["user_id"], issue_id=issue.id)

        assert row.analysis_issue_id is None
        assert row.area == "BUNKER"

    def test_falls_back_to_the_analysis_issue_for_an_older_build(self, db_session, test_user):
        """Builds shipped before `issue_id` existed send only `analysis_issue_id`."""
        issue = _issue(db_session, "CHIPPING")
        analysis_issue = _analysis_issue(db_session, issue, test_user["user_id"])

        row = _start(db_session, test_user["user_id"], analysis_issue_id=analysis_issue.id)

        assert row.area == "CHIPPING"

    def test_the_issue_id_wins_over_the_analysis_link(self, db_session, test_user):
        """Both sent: the explicit id is the more direct statement of what is being worked."""
        practised = _issue(db_session, "PITCHING", title="Practised")
        other = _issue(db_session, "FULL_SWING", title="Other")
        analysis_issue = _analysis_issue(db_session, other, test_user["user_id"])

        row = _start(
            db_session,
            test_user["user_id"],
            issue_id=practised.id,
            analysis_issue_id=analysis_issue.id,
        )

        assert row.area == "PITCHING"

    def test_it_is_a_snapshot_not_a_live_join(self, db_session, test_user):
        """Re-filing an issue must not repaint history.

        A session's area is a fact about a day that already happened. This is deliberately
        the opposite of a drill run's grade, which IS re-derived on every read.
        """
        issue = _issue(db_session, "CHIPPING")
        row = _start(db_session, test_user["user_id"], issue_id=issue.id)

        issue.area = "PITCHING"
        db_session.flush()
        db_session.expire_all()

        assert repo.get_practice_session_by_id(row.id, db_session).area == "CHIPPING"


class TestUnattributed:
    def test_free_practice_has_no_area_and_is_not_an_error(self, db_session, test_user):
        """No issue behind it. The session still happened and still earns its square, so
        this is a real state the graph renders, not a failure."""
        row = _start(db_session, test_user["user_id"])

        assert row.area is None
        assert row.status == "in_progress"

    def test_an_unknown_issue_id_leaves_it_unattributed(self, db_session, test_user):
        """Refusing here would lose a session the golfer actually did, over a label."""
        from uuid import uuid4

        row = _start(db_session, test_user["user_id"], issue_id=uuid4())

        assert row.area is None

    def test_an_issue_always_has_an_area_so_there_is_no_third_gap(self, db_session, test_user):
        """`issues.area` is NOT NULL with a FULL_SWING server default (Issue.py:41-46), so
        "issue with no area" cannot happen. Unattributed has exactly two causes: no issue
        was named, or the one named is gone."""
        issue = _issue(db_session, None)
        assert issue.area == "FULL_SWING"

        row = _start(db_session, test_user["user_id"], issue_id=issue.id)

        assert row.area == "FULL_SWING"
