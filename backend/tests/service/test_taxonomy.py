"""Taxonomy vocabulary tests.

Two behaviours are deliberately different and both matter:

  * the LENIENT normalizers drop unknown values and succeed — right for the AI
    structurer, where a hallucinated tag should degrade rather than 500 the request;
  * the STRICT normalizers raise — right for the admin, where a silently dropped tag
    is invisible data loss (you tick a box, get a 200, and the tag isn't there).

If someone ever "simplifies" these into one function, these tests should fail loudly.
"""

import pytest

from core.services import exceptions
from core.services.taxonomy import (
    ALLOWED_AREAS,
    ALLOWED_GOALS,
    ALLOWED_KINDS,
    ALLOWED_MISSES,
    DEFAULT_AREA,
    DEFAULT_KIND,
    normalize_area_strict,
    normalize_goals,
    normalize_goals_strict,
    normalize_kind_strict,
    normalize_miss,
    normalize_misses_strict,
)


class TestStrictMisses:
    def test_accepts_every_allowed_value(self):
        assert normalize_misses_strict(list(ALLOWED_MISSES)) == list(ALLOWED_MISSES)

    def test_upper_cases_and_strips(self):
        assert normalize_misses_strict(["  slice ", "hook"]) == ["SLICE", "HOOK"]

    def test_deduplicates_preserving_order(self):
        assert normalize_misses_strict(["PULL", "slice", "PULL"]) == ["PULL", "SLICE"]

    def test_empty_and_none_inputs_yield_empty_list(self):
        assert normalize_misses_strict([]) == []
        assert normalize_misses_strict(None) == []

    def test_skips_blank_entries_without_raising(self):
        assert normalize_misses_strict(["SLICE", None, "", "   "]) == ["SLICE"]

    def test_raises_on_unknown_value(self):
        with pytest.raises(exceptions.ValidationException):
            normalize_misses_strict(["SLICE", "BANANA"])

    def test_error_message_names_the_offending_value(self):
        """The admin UI renders this message inline next to the tag picker, so it has
        to say which value was rejected."""
        with pytest.raises(exceptions.ValidationException) as exc:
            normalize_misses_strict(["BANANA"])
        assert "BANANA" in str(exc.value)


class TestStrictGoals:
    def test_accepts_every_allowed_value(self):
        assert normalize_goals_strict(list(ALLOWED_GOALS)) == list(ALLOWED_GOALS)

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
        for area in ALLOWED_AREAS:
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
    """Regression guard: the AI and user-authoring paths depend on silent dropping."""

    def test_lenient_miss_returns_none_for_unknown(self):
        assert normalize_miss("BANANA") is None
        assert normalize_miss("slice") == "SLICE"

    def test_lenient_goals_drops_unknown_without_raising(self):
        assert normalize_goals(["CONTACT", "VIBES"]) == ["CONTACT"]

    def test_lenient_goals_handles_empty(self):
        assert normalize_goals(None) == []
        assert normalize_goals([]) == []


class TestVocabulariesAreNonEmptyAndConsistent:
    """Cheap sanity net. The DB CHECK constraints mirror these tuples by hand, so an
    accidental edit here is a schema drift waiting to happen."""

    def test_defaults_are_members_of_their_vocabulary(self):
        assert DEFAULT_AREA in ALLOWED_AREAS
        assert DEFAULT_KIND in ALLOWED_KINDS

    def test_no_duplicates_within_a_vocabulary(self):
        for vocab in (ALLOWED_AREAS, ALLOWED_MISSES, ALLOWED_GOALS, ALLOWED_KINDS):
            assert len(vocab) == len(set(vocab))
