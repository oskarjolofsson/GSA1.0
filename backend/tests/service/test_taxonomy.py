"""Taxonomy vocabulary tests.

Rewritten when the vocabulary moved from module tuples into the `taxonomy_*` tables
(migration 20260802000000). The old version imported ALLOWED_AREAS and friends directly;
those no longer exist, because a constant snapshotted at import can never see an admin edit.

Three behaviours are asserted here, and none of them can be collapsed into the others:

  strict vs lenient   strict raises 422 so an admin never sees a tag silently vanish;
                      lenient drops unknowns so one bad AI value cannot fail a request.
  area scoping        a miss belongs to exactly one area. SLICE on a putting issue is
                      refused even though SLICE is a perfectly real miss.
  cache freshness     the vocabulary is process-cached, so a write must bust it.

These read the database. `conftest._cold_taxonomy_cache` resets the cache around every
test, so nothing here depends on what ran before.
"""

import pytest

from core.infrastructure.db import models
from core.services import exceptions, taxonomy
from core.services.taxonomy import (
    DEFAULT_AREA,
    DEFAULT_KIND,
    ALLOWED_KINDS,
    normalize_area_strict,
    normalize_goals,
    normalize_goals_strict,
    normalize_kind_strict,
    normalize_miss,
    normalize_misses_strict,
)

FULL_SWING = "FULL_SWING"


class TestStrictMisses:
    def test_accepts_every_miss_in_the_area(self):
        misses = list(taxonomy.misses_for(FULL_SWING))
        assert normalize_misses_strict(misses, FULL_SWING) == misses

    def test_upper_cases_and_strips(self):
        assert normalize_misses_strict(["  slice ", "hook"], FULL_SWING) == ["SLICE", "HOOK"]

    def test_deduplicates_preserving_order(self):
        assert normalize_misses_strict(["PULL", "slice", "PULL"], FULL_SWING) == ["PULL", "SLICE"]

    def test_empty_and_none_inputs_yield_empty_list(self):
        assert normalize_misses_strict([], FULL_SWING) == []
        assert normalize_misses_strict(None, FULL_SWING) == []

    def test_skips_blank_entries_without_raising(self):
        assert normalize_misses_strict(["SLICE", None, "", "   "], FULL_SWING) == ["SLICE"]

    def test_raises_on_unknown_value(self):
        with pytest.raises(exceptions.ValidationException):
            normalize_misses_strict(["SLICE", "BANANA"], FULL_SWING)

    def test_error_message_names_the_offending_value(self):
        """Clients surface this message directly, so it must name the bad value."""
        with pytest.raises(exceptions.ValidationException) as exc:
            normalize_misses_strict(["BANANA"], FULL_SWING)
        assert "BANANA" in str(exc.value)

    def test_raises_on_unknown_area(self):
        with pytest.raises(exceptions.ValidationException) as exc:
            normalize_misses_strict(["SLICE"], "MOON")
        assert "MOON" in str(exc.value)


class TestMissesAreAreaScoped:
    """The rule that makes area-first navigation honest.

    Before the taxonomy moved into the database all eight misses were one flat ball-flight
    list, so nothing stopped a putting issue being tagged SLICE — and the coverage grid
    would then report content the library's own navigation could never reach.
    """

    def test_cross_area_miss_is_refused(self, db_session):
        # A chipping miss, so there is something real in another area to test against.
        db_session.add(
            models.TaxonomyMiss(
                key="CHUNK", area="CHIPPING", label="Chunk",
                golfer_label="I chunk it", blurb="Club hits the ground first",
            )
        )
        db_session.flush()
        taxonomy.prime_from(db_session)

        assert normalize_misses_strict(["CHUNK"], "CHIPPING") == ["CHUNK"]

        with pytest.raises(exceptions.ValidationException) as exc:
            normalize_misses_strict(["SLICE"], "CHIPPING")
        message = str(exc.value)
        assert "SLICE" in message
        # The message says where it actually belongs, not just that it is wrong here —
        # an admin fixing a mis-tag needs to know which area to move it to.
        assert FULL_SWING in message

    def test_misses_for_returns_only_that_area(self, db_session):
        db_session.add(
            models.TaxonomyMiss(
                key="BLADE", area="CHIPPING", label="Blade",
                golfer_label="I blade it", blurb="Caught thin, screams across the green",
            )
        )
        db_session.flush()
        taxonomy.prime_from(db_session)

        assert "BLADE" in taxonomy.misses_for("CHIPPING")
        assert "BLADE" not in taxonomy.misses_for(FULL_SWING)
        assert "SLICE" in taxonomy.misses_for(FULL_SWING)

    def test_misses_for_raises_on_unknown_area(self):
        with pytest.raises(exceptions.ValidationException):
            taxonomy.misses_for("MOON")

    def test_area_of_miss_reports_the_owner(self):
        assert taxonomy.area_of_miss("SLICE") == FULL_SWING
        assert taxonomy.area_of_miss("slice") == FULL_SWING
        assert taxonomy.area_of_miss("BANANA") is None

    def test_area_with_no_misses_yet_returns_empty(self):
        """Seeded areas start empty. That is a gap to fill, not an error."""
        assert taxonomy.misses_for("PUTTING") == ()


class TestCacheFreshness:
    """The vocabulary is held in a process-level cache so the validators stay pure.

    That is the first process-lived state in the backend, so the two ways it can go wrong
    are worth pinning: a write that does not bust it is invisible, and a cache that
    survives a rollback serves rows that no longer exist.
    """

    def test_new_value_is_invisible_until_the_cache_is_reset(self, db_session):
        db_session.add(
            models.TaxonomyGoal(key="TEMPO", label="Tempo", golfer_label="Better tempo")
        )
        db_session.flush()

        # Warm the cache first so we are testing staleness, not load order. This read
        # opens its own session, which cannot see the uncommitted insert above.
        assert "TEMPO" not in taxonomy.allowed_goals()

        taxonomy.prime_from(db_session)
        assert "TEMPO" in taxonomy.allowed_goals()

    def test_reset_reloads_rather_than_clearing(self):
        taxonomy.reset_cache()
        assert FULL_SWING in taxonomy.allowed_areas()


class TestStrictGoals:
    def test_accepts_every_allowed_value(self):
        goals = list(taxonomy.allowed_goals())
        assert normalize_goals_strict(goals) == goals

    def test_upper_cases_and_deduplicates(self):
        assert normalize_goals_strict(["contact", "CONTACT"]) == ["CONTACT"]

    def test_raises_on_unknown_value(self):
        with pytest.raises(exceptions.ValidationException):
            normalize_goals_strict(["CONTACT", "VIBES"])

    def test_empty_input_yields_empty_list(self):
        assert normalize_goals_strict([]) == []
        assert normalize_goals_strict(None) == []


class TestStrictAreaAndKind:
    def test_area_defaults_when_absent(self):
        assert normalize_area_strict(None) == DEFAULT_AREA
        assert normalize_area_strict("") == DEFAULT_AREA
        assert normalize_area_strict("   ") == DEFAULT_AREA

    def test_area_accepts_every_allowed_value(self):
        for area in taxonomy.allowed_areas():
            assert normalize_area_strict(area.lower()) == area

    def test_area_raises_on_unknown(self):
        with pytest.raises(exceptions.ValidationException):
            normalize_area_strict("MOON")

    def test_kind_defaults_when_absent(self):
        assert normalize_kind_strict(None) == DEFAULT_KIND

    def test_kind_accepts_every_allowed_value(self):
        for kind in ALLOWED_KINDS:
            assert normalize_kind_strict(kind.upper()) == kind

    def test_kind_raises_on_unknown(self):
        with pytest.raises(exceptions.ValidationException):
            normalize_kind_strict("vibe")


class TestLenientStillLenient:
    """The AI and user-authoring paths depend on unknown values being dropped."""

    def test_lenient_miss_returns_none_for_unknown(self):
        assert normalize_miss("BANANA") is None
        assert normalize_miss("slice") == "SLICE"

    def test_lenient_miss_is_deliberately_not_area_scoped(self, db_session):
        """A model returning an out-of-area miss should lose that tag, not fail the call.

        The prompt is scoped upstream (feedbackStructurer builds it per area), so this is
        a backstop. Raising here would turn a stray AI value into a user-visible 500 on
        the premium coach-feedback path.
        """
        db_session.add(
            models.TaxonomyMiss(
                key="SPLASH", area="BUNKER", label="Cannot escape",
                golfer_label="I leave it in the sand",
            )
        )
        db_session.flush()
        taxonomy.prime_from(db_session)

        assert normalize_miss("SPLASH") == "SPLASH"

    def test_lenient_goals_drops_unknown_without_raising(self):
        assert normalize_goals(["CONTACT", "VIBES"]) == ["CONTACT"]

    def test_lenient_goals_handles_empty(self):
        assert normalize_goals(None) == []
        assert normalize_goals([]) == []


class TestVocabulariesAreNonEmptyAndConsistent:
    def test_defaults_are_members_of_their_vocabulary(self):
        assert DEFAULT_AREA in taxonomy.allowed_areas()
        assert DEFAULT_KIND in ALLOWED_KINDS

    def test_no_duplicates_within_a_vocabulary(self):
        for vocab in (
            taxonomy.allowed_areas(),
            taxonomy.allowed_misses(),
            taxonomy.allowed_goals(),
            ALLOWED_KINDS,
        ):
            assert len(vocab) == len(set(vocab))

    def test_every_miss_belongs_to_a_real_area(self):
        areas = set(taxonomy.allowed_areas())
        for miss in taxonomy.allowed_misses():
            assert taxonomy.area_of_miss(miss) in areas
