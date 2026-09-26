"""The issue <-> drill junction: the last link the analysis walks, issue -> drill.

Until now this table was only ever created as a fixture inside other tests, so its
own constraints were never asserted.
"""

import uuid

import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from ....core.infrastructure.db.models.Drill import Drill
from ....core.infrastructure.db.models.Issue import Issue
from ....core.infrastructure.db.repositories.drills import create_drill
from ....core.infrastructure.db.repositories.issue_drills import (
    add_issue_drill,
    get_issue_drills_by_drill_id,
    get_issue_drills_by_issue_id,
)
from ....core.infrastructure.db.repositories.issues import create_issue


def _issue(session) -> Issue:
    return create_issue(Issue(title=f"Issue {uuid.uuid4().hex[:8]}", description="d"), session)


def _drill(session) -> Drill:
    return create_drill(
        Drill(title=f"Drill {uuid.uuid4().hex[:8]}", task="t", success_signal="s", fault_indicator="f"),
        session,
    )


def _link_count(session, column: str, value) -> int:
    return session.scalar(
        text(f"SELECT count(*) FROM issue_drill WHERE {column} = :v"), {"v": value}
    )


class TestIssueDrillLinks:

    def test_issue_can_have_several_drills(self, db_session):
        """
        An issue can be linked to multiple drills.
        """
        issue = _issue(db_session)
        d1, d2 = _drill(db_session), _drill(db_session)
        add_issue_drill(issue.id, d1.id, db_session)
        add_issue_drill(issue.id, d2.id, db_session)

        links = get_issue_drills_by_issue_id(issue.id, db_session)

        assert {l.drill_id for l in links} == {d1.id, d2.id}

    def test_drill_can_serve_several_issues(self, db_session):
        """
        A drill can be linked to multiple issues.
        """
        drill = _drill(db_session)
        a, b = _issue(db_session), _issue(db_session)
        add_issue_drill(a.id, drill.id, db_session)
        add_issue_drill(b.id, drill.id, db_session)

        links = get_issue_drills_by_drill_id(drill.id, db_session)

        assert {l.issue_id for l in links} == {a.id, b.id}

    def test_same_drill_twice_on_one_issue_is_rejected(self, db_session):
        """
        A drill cannot be linked to the same issue twice.
        """
        issue, drill = _issue(db_session), _drill(db_session)
        add_issue_drill(issue.id, drill.id, db_session)

        with pytest.raises(IntegrityError):
            add_issue_drill(issue.id, drill.id, db_session)

    def test_unknown_drill_is_rejected(self, db_session):
        """
        A drill that does not exist cannot be linked to an issue.
        """
        issue = _issue(db_session)

        with pytest.raises(IntegrityError):
            add_issue_drill(issue.id, uuid.uuid4(), db_session)


class TestIssueDrillDeletes:
    def test_deleting_an_issue_clears_its_drill_links_but_keeps_the_drill(self, db_session):
        """
        Deleting an issue should remove its links to drills, but the drills themselves should remain in the database.
        """
        issue, drill = _issue(db_session), _drill(db_session)
        add_issue_drill(issue.id, drill.id, db_session)
        issue_id, drill_id = issue.id, drill.id
        db_session.expunge_all()

        db_session.execute(text("DELETE FROM issues WHERE id = :id"), {"id": issue_id})

        assert _link_count(db_session, "issue_id", issue_id) == 0
        assert db_session.scalar(text("SELECT 1 FROM drills WHERE id = :id"), {"id": drill_id})

    def test_deleting_a_drill_clears_its_issue_links_but_keeps_the_issue(self, db_session):
        """
        Deleting a drill should remove its links to issues, but the issues themselves should remain in the database.
        """
        issue, drill = _issue(db_session), _drill(db_session)
        add_issue_drill(issue.id, drill.id, db_session)
        issue_id, drill_id = issue.id, drill.id
        db_session.expunge_all()

        db_session.execute(text("DELETE FROM drills WHERE id = :id"), {"id": drill_id})

        assert _link_count(db_session, "drill_id", drill_id) == 0
        assert db_session.scalar(text("SELECT 1 FROM issues WHERE id = :id"), {"id": issue_id})
