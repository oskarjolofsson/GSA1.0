"""The laws of ball flight and the issue <-> law junction.

The analysis walks miss -> law -> issue -> drill, so these guard the middle link:
the seeded vocabulary it picks from, and the foreign keys that keep issue_laws honest.
Deletes go through raw SQL where the point is the database constraint, not the ORM
cascade on Issue.laws.
"""

import uuid

import pytest
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError

from ....core.infrastructure.db.models.Issue import Issue
from ....core.infrastructure.db.models.IssueLaw import IssueLaw
from ....core.infrastructure.db.models.TaxonomyLaw import TaxonomyLaw
from ....core.infrastructure.db.repositories.issues import create_issue, get_issue_by_id


SEEDED_LAWS = ["FACE", "PATH", "CENTEREDNESS", "ANGLE_OF_ATTACK", "DYNAMIC_LOFT", "SPEED"]


def _issue(session, title="Over the top") -> Issue:
    return create_issue(Issue(title=f"{title} {uuid.uuid4().hex[:8]}", description="d"), session)


def _law_links(session, issue_id) -> list[str]:
    return list(
        session.scalars(
            text("SELECT law FROM issue_laws WHERE issue_id = :id ORDER BY law"),
            {"id": issue_id},
        )
    )


class TestSeededLaws:
    def test_all_six_laws_are_seeded_active_in_display_order(self, db_session):
        """
        The six laws of ball flight are seeded into the database, active, and in the order
        they should be displayed.
        """
        rows = db_session.scalars(
            select(TaxonomyLaw).where(TaxonomyLaw.active.is_(True)).order_by(TaxonomyLaw.sort)
        ).all()

        assert [r.key for r in rows] == SEEDED_LAWS

    def test_every_seeded_law_has_golfer_facing_copy(self, db_session):
        """
        Every seeded law should have a label, a golfer-facing label, and a blurb.
        """
        for law in db_session.scalars(select(TaxonomyLaw)).all():
            assert law.label and law.golfer_label and law.blurb, law.key


class TestIssueLawLinks:
    def test_issue_can_break_several_laws(self, db_session):
        """
        One issue can be linked to multiple laws, and they should be returned in index order.
        """
        issue = _issue(db_session)
        issue.laws.append(IssueLaw(law="PATH", rank=1))
        issue.laws.append(IssueLaw(law="ANGLE_OF_ATTACK", rank=1))
        db_session.flush()
        db_session.expunge_all()

        reloaded = get_issue_by_id(issue.id, db_session)

        assert sorted(l.law for l in reloaded.laws) == ["ANGLE_OF_ATTACK", "PATH"]

    def test_law_has_several_issues(self, db_session):
        a, b = _issue(db_session, "A"), _issue(db_session, "B")
        db_session.add_all([IssueLaw(issue_id=a.id, law="FACE", rank=1), IssueLaw(issue_id=b.id, law="FACE", rank=2)])
        db_session.flush()

        ids = set(
            db_session.scalars(select(IssueLaw.issue_id).where(IssueLaw.law == "FACE")).all()
        )

        assert {a.id, b.id} <= ids

    def test_unknown_law_is_rejected(self, db_session):
        issue = _issue(db_session)
        db_session.add(IssueLaw(issue_id=issue.id, law="NOT_A_LAW", rank=1))

        with pytest.raises(IntegrityError):
            db_session.flush()

    def test_same_law_twice_on_one_issue_is_rejected(self, db_session):
        issue = _issue(db_session)
        db_session.execute(
            text("INSERT INTO issue_laws (issue_id, law, rank) VALUES (:id, 'FACE', 1)"), {"id": issue.id}
        )

        with pytest.raises(IntegrityError):
            db_session.execute(
                text("INSERT INTO issue_laws (issue_id, law, rank) VALUES (:id, 'FACE', 1)"),
                {"id": issue.id},
            )


class TestIssueLawRanking:
    """Rank 1 is the issue that breaks the law most often. The rank tests use their own
    TEST_LAW so issues a coach has ranked under a real law can never collide with them."""

    @pytest.fixture()
    def test_law(self, db_session):
        db_session.add(TaxonomyLaw(key="TEST_LAW", label="t", golfer_label="t"))
        db_session.flush()
        return "TEST_LAW"

    def test_issues_under_a_law_come_back_in_rank_order(self, db_session, test_law):
        """The rank column is used to order issues under a law."""
        second, first, third = _issue(db_session), _issue(db_session), _issue(db_session)
        db_session.add_all([
            IssueLaw(issue_id=second.id, law=test_law, rank=2),
            IssueLaw(issue_id=first.id, law=test_law, rank=1),
            IssueLaw(issue_id=third.id, law=test_law, rank=3),
        ])
        db_session.flush()

        ranked = db_session.scalars(
            select(IssueLaw.issue_id).where(IssueLaw.law == test_law).order_by(IssueLaw.rank)
        ).all()

        assert ranked == [first.id, second.id, third.id]

    def test_two_issues_cannot_share_a_rank_under_one_law(self, db_session, test_law):
        """Deferred, so the clash surfaces at commit. SET CONSTRAINTS forces the check
        now, since db_session rolls back instead of committing."""
        a, b = _issue(db_session), _issue(db_session)
        db_session.add_all([
            IssueLaw(issue_id=a.id, law=test_law, rank=1),
            IssueLaw(issue_id=b.id, law=test_law, rank=1),
        ])
        db_session.flush()

        with pytest.raises(IntegrityError):
            db_session.execute(text("SET CONSTRAINTS ALL IMMEDIATE"))

    def test_same_rank_under_different_laws_is_allowed(self, db_session, test_law):
        db_session.add(TaxonomyLaw(key="TEST_LAW_2", label="t", golfer_label="t"))
        issue = _issue(db_session)
        issue.laws.append(IssueLaw(law=test_law, rank=1))
        issue.laws.append(IssueLaw(law="TEST_LAW_2", rank=1))
        db_session.flush()

        db_session.execute(text("SET CONSTRAINTS ALL IMMEDIATE"))

    def test_two_ranks_can_be_swapped_in_one_transaction(self, db_session, test_law):
        """What the deferred constraint is for: a reorder passes through a moment where
        two rows hold the same rank."""
        a, b = _issue(db_session), _issue(db_session)
        link_a = IssueLaw(issue_id=a.id, law=test_law, rank=1)
        link_b = IssueLaw(issue_id=b.id, law=test_law, rank=2)
        db_session.add_all([link_a, link_b])
        db_session.flush()

        link_a.rank = 2
        db_session.flush()
        link_b.rank = 1
        db_session.flush()

        db_session.execute(text("SET CONSTRAINTS ALL IMMEDIATE"))

    @pytest.mark.parametrize("rank", [0, -1])
    def test_rank_must_be_positive(self, db_session, test_law, rank):
        db_session.add(IssueLaw(issue_id=_issue(db_session).id, law=test_law, rank=rank))

        with pytest.raises(IntegrityError):
            db_session.flush()

    def test_rank_is_required(self, db_session, test_law):
        db_session.add(IssueLaw(issue_id=_issue(db_session).id, law=test_law))

        with pytest.raises(IntegrityError):
            db_session.flush()


class TestIssueLawDeletes:
    def test_deleting_an_issue_clears_its_law_links(self, db_session):
        issue = _issue(db_session)
        issue.laws.append(IssueLaw(law="FACE", rank=1))
        db_session.flush()
        issue_id = issue.id
        db_session.expunge_all()

        db_session.execute(text("DELETE FROM issues WHERE id = :id"), {"id": issue_id})

        assert _law_links(db_session, issue_id) == []

    def test_deleting_a_law_still_in_use_is_refused(self, db_session):
        """RESTRICT: retire a law with active = false, never by deleting it."""
        db_session.add(TaxonomyLaw(key="TEST_LAW", label="t", golfer_label="t"))
        issue = _issue(db_session)
        issue.laws.append(IssueLaw(law="TEST_LAW", rank=1))
        db_session.flush()

        with pytest.raises(IntegrityError):
            db_session.execute(text("DELETE FROM taxonomy_laws WHERE key = 'TEST_LAW'"))

    def test_deleting_an_unused_law_succeeds(self, db_session):
        db_session.add(TaxonomyLaw(key="TEST_LAW", label="t", golfer_label="t"))
        db_session.flush()

        db_session.execute(text("DELETE FROM taxonomy_laws WHERE key = 'TEST_LAW'"))

        assert db_session.get(TaxonomyLaw, "TEST_LAW", populate_existing=True) is None
