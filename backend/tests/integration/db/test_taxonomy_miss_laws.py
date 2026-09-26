"""The miss <-> law junction: which laws of ball flight can cause a miss.

The analysis narrows its law candidates through this table, so it guards the first
link of miss -> law -> issue -> drill. Deletes go through raw SQL because the point is
the database constraint.
"""

import pytest
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError

from ....core.infrastructure.db.models.TaxonomyLaw import TaxonomyLaw
from ....core.infrastructure.db.models.TaxonomyMiss import TaxonomyMiss
from ....core.infrastructure.db.models.TaxonomyMissLaw import TaxonomyMissLaw
from ....core.infrastructure.db.repositories.taxonomy import list_laws_for_miss


def _test_miss(session) -> TaxonomyMiss:
    miss = TaxonomyMiss(key="TEST_MISS", area="FULL_SWING", label="t", golfer_label="t")
    session.add(miss)
    session.flush()
    return miss


def _laws_of(session, miss: str) -> list[str]:
    return list(
        session.scalars(
            text("SELECT law FROM taxonomy_miss_laws WHERE miss = :m ORDER BY law"), {"m": miss}
        )
    )


class TestMissLawLinks:
    def test_miss_can_have_several_laws(self, db_session):
        _test_miss(db_session)
        db_session.add_all([
            TaxonomyMissLaw(miss="TEST_MISS", law="FACE", rank=1),
            TaxonomyMissLaw(miss="TEST_MISS", law="PATH", rank=2),
        ])
        db_session.flush()

        assert _laws_of(db_session, "TEST_MISS") == ["FACE", "PATH"]

    def test_law_can_cause_several_misses(self, db_session):
        _test_miss(db_session)
        db_session.add(TaxonomyMiss(key="TEST_MISS_2", area="FULL_SWING", label="t", golfer_label="t"))
        db_session.flush()
        db_session.add_all([
            TaxonomyMissLaw(miss="TEST_MISS", law="FACE", rank=1),
            TaxonomyMissLaw(miss="TEST_MISS_2", law="FACE", rank=1),
        ])
        db_session.flush()

        misses = set(
            db_session.scalars(
                select(TaxonomyMissLaw.miss).where(TaxonomyMissLaw.law == "FACE")
            ).all()
        )

        assert {"TEST_MISS", "TEST_MISS_2"} <= misses

    def test_unknown_law_is_rejected(self, db_session):
        _test_miss(db_session)
        db_session.add(TaxonomyMissLaw(miss="TEST_MISS", law="NOT_A_LAW", rank=1))

        with pytest.raises(IntegrityError):
            db_session.flush()

    def test_unknown_miss_is_rejected(self, db_session):
        db_session.add(TaxonomyMissLaw(miss="NOT_A_MISS", law="FACE", rank=1))

        with pytest.raises(IntegrityError):
            db_session.flush()

    def test_same_law_twice_on_one_miss_is_rejected(self, db_session):
        _test_miss(db_session)
        db_session.execute(text("INSERT INTO taxonomy_miss_laws (miss, law, rank) VALUES ('TEST_MISS', 'FACE', 1)"))

        with pytest.raises(IntegrityError):
            db_session.execute(
                text("INSERT INTO taxonomy_miss_laws (miss, law, rank) VALUES ('TEST_MISS', 'FACE', 1)")
            )


class TestMissLawRanking:
    """Rank 1 is the law most likely behind the miss: the first candidate the analysis
    weighs."""

    def test_laws_of_a_miss_come_back_in_rank_order(self, db_session):
        _test_miss(db_session)
        db_session.add_all([
            TaxonomyMissLaw(miss="TEST_MISS", law="PATH", rank=2),
            TaxonomyMissLaw(miss="TEST_MISS", law="FACE", rank=1),
            TaxonomyMissLaw(miss="TEST_MISS", law="SPEED", rank=3),
        ])
        db_session.flush()

        ranked = db_session.scalars(
            select(TaxonomyMissLaw.law)
            .where(TaxonomyMissLaw.miss == "TEST_MISS")
            .order_by(TaxonomyMissLaw.rank)
        ).all()

        assert ranked == ["FACE", "PATH", "SPEED"]

    def test_two_laws_cannot_share_a_rank_on_one_miss(self, db_session):
        """Deferred, so the clash surfaces at commit. SET CONSTRAINTS forces the check
        now, since db_session rolls back instead of committing."""
        _test_miss(db_session)
        db_session.add_all([
            TaxonomyMissLaw(miss="TEST_MISS", law="FACE", rank=1),
            TaxonomyMissLaw(miss="TEST_MISS", law="PATH", rank=1),
        ])
        db_session.flush()

        with pytest.raises(IntegrityError):
            db_session.execute(text("SET CONSTRAINTS ALL IMMEDIATE"))

    def test_two_ranks_can_be_swapped_in_one_transaction(self, db_session):
        _test_miss(db_session)
        face = TaxonomyMissLaw(miss="TEST_MISS", law="FACE", rank=1)
        path = TaxonomyMissLaw(miss="TEST_MISS", law="PATH", rank=2)
        db_session.add_all([face, path])
        db_session.flush()

        face.rank = 2
        db_session.flush()
        path.rank = 1
        db_session.flush()

        db_session.execute(text("SET CONSTRAINTS ALL IMMEDIATE"))

    @pytest.mark.parametrize("rank", [0, -1])
    def test_rank_must_be_positive(self, db_session, rank):
        _test_miss(db_session)
        db_session.add(TaxonomyMissLaw(miss="TEST_MISS", law="FACE", rank=rank))

        with pytest.raises(IntegrityError):
            db_session.flush()

    def test_rank_is_required(self, db_session):
        _test_miss(db_session)
        db_session.add(TaxonomyMissLaw(miss="TEST_MISS", law="FACE"))

        with pytest.raises(IntegrityError):
            db_session.flush()


class TestListLawsForMiss:
    """The repository read the analysis narrows its law candidates with."""

    def test_returns_laws_most_likely_first(self, db_session):
        _test_miss(db_session)
        db_session.add_all([
            TaxonomyMissLaw(miss="TEST_MISS", law="PATH", rank=2),
            TaxonomyMissLaw(miss="TEST_MISS", law="FACE", rank=1),
        ])
        db_session.flush()

        assert [l.key for l in list_laws_for_miss("TEST_MISS", db_session)] == ["FACE", "PATH"]

    def test_leaves_out_retired_laws(self, db_session):
        _test_miss(db_session)
        db_session.add(TaxonomyLaw(key="TEST_LAW", label="t", golfer_label="t", active=False))
        db_session.flush()
        db_session.add_all([
            TaxonomyMissLaw(miss="TEST_MISS", law="FACE", rank=1),
            TaxonomyMissLaw(miss="TEST_MISS", law="TEST_LAW", rank=2),
        ])
        db_session.flush()

        assert [l.key for l in list_laws_for_miss("TEST_MISS", db_session)] == ["FACE"]

    def test_unmapped_miss_returns_empty(self, db_session):
        _test_miss(db_session)

        assert list_laws_for_miss("TEST_MISS", db_session) == []


class TestMissLawDeletes:
    def test_deleting_a_miss_clears_its_law_links(self, db_session):
        """CASCADE: the links are part of the miss's definition."""
        _test_miss(db_session)
        db_session.add(TaxonomyMissLaw(miss="TEST_MISS", law="FACE", rank=1))
        db_session.flush()
        db_session.expunge_all()

        db_session.execute(text("DELETE FROM taxonomy_misses WHERE key = 'TEST_MISS'"))

        assert _laws_of(db_session, "TEST_MISS") == []

    def test_deleting_a_law_still_linked_to_a_miss_is_refused(self, db_session):
        """RESTRICT: retire a law with active = false, never by deleting it."""
        _test_miss(db_session)
        db_session.add(TaxonomyLaw(key="TEST_LAW", label="t", golfer_label="t"))
        db_session.flush()
        db_session.add(TaxonomyMissLaw(miss="TEST_MISS", law="TEST_LAW", rank=1))
        db_session.flush()

        with pytest.raises(IntegrityError):
            db_session.execute(text("DELETE FROM taxonomy_laws WHERE key = 'TEST_LAW'"))
