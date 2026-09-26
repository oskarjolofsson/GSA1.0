"""The coach-feedback prompt is built per request, scoped to one area.

Free to run: this asserts on the prompt string, never calling Gemini. The live-model check
lives in tests/integration/AI/ behind --run-ai.

Two bugs this guards, both introduced the moment the vocabulary moved into the database:

  staleness   the prompt used to interpolate a module-level snapshot taken at import, so a
              miss added from the admin dashboard never reached the model until a restart —
              the CMS silently doing nothing for this path.

  wrong area  the prompt used to list every miss across every area. Given chipping notes
              the model would answer SLICE, which the area-scoped validator then rejects
              with a 422 — a user-triggerable failure in the paid tier that reads as the AI
              being broken.
"""

from unittest.mock import patch

import pytest

from core.infrastructure.ai import coach_feedback, gemini
from core.infrastructure.ai.errors import AIInvalidResponse
from core.infrastructure.db import models
from core.services import issue_authoring_service as ias
from core.services import taxonomy

_VALID_DRAFT = {"issue": {"title": "t", "description": "d"}, "drills": []}


def _run(area="FULL_SWING", answer=None) -> tuple[str, dict]:
    """Run the real coach-feedback path for `area` with Gemini stubbed out.

    Returns the system prompt the AI layer built and the draft it returned. Goes through
    the service on purpose: reading the vocabulary fresh and scoped to the area is the
    service's half of the contract, building the prompt from it is the AI layer's.
    """
    with patch.object(gemini, "generate_json", return_value=answer or _VALID_DRAFT) as call:
        draft = ias._default_structurer(text="coach notes", image_bytes=None, image_mime=None, area=area)
    return call.call_args.kwargs["system_instruction"], draft


def build_system_instructions(area: str) -> str:
    return _run(area)[0]


class TestPromptIsScopedToItsArea:
    def test_full_swing_prompt_lists_full_swing_misses(self):
        prompt = build_system_instructions("FULL_SWING")

        assert "SLICE" in prompt
        assert "FAT" in prompt
        assert "FULL_SWING" in prompt

    def test_prompt_excludes_misses_from_other_areas(self, db_session):
        """The point of scoping. A chipping prompt must not offer a ball-flight term."""
        db_session.add(
            models.TaxonomyMiss(
                key="CHUNK", area="CHIPPING", label="Chunk",
                golfer_label="I chunk it", blurb="Club hits the ground first",
            )
        )
        db_session.flush()
        taxonomy.prime_from(db_session)

        prompt = build_system_instructions("CHIPPING")

        assert "CHUNK" in prompt
        assert "SLICE" not in prompt, "a chip cannot be sliced"
        assert "HOOK" not in prompt

    def test_prompt_names_the_area_so_the_model_has_context(self):
        assert "CHIPPING" in build_system_instructions("CHIPPING")

    def test_goals_are_not_area_scoped(self):
        """Goals apply everywhere; only misses belong to one area."""
        for area in ("FULL_SWING", "PUTTING"):
            prompt = build_system_instructions(area)
            for goal in taxonomy.allowed_goals():
                assert goal in prompt


class TestPromptTracksTheDatabase:
    def test_a_new_miss_reaches_the_prompt_without_a_restart(self, db_session):
        """The staleness bug. Nothing is snapshotted at import any more."""
        before = build_system_instructions("PUTTING")
        assert "LEAVES_SHORT" not in before

        db_session.add(
            models.TaxonomyMiss(
                key="LEAVES_SHORT", area="PUTTING", label="Leaves it short",
                golfer_label="I leave them short", blurb="Never gets to the hole",
            )
        )
        db_session.flush()
        taxonomy.prime_from(db_session)

        assert "LEAVES_SHORT" in build_system_instructions("PUTTING")

    def test_an_area_with_no_misses_yet_still_builds(self, db_session):
        """Seeded areas start empty, and authoring is weeks of work — an empty list must
        not crash the premium path in the meantime."""
        prompt = build_system_instructions("BUNKER")
        assert "BUNKER" in prompt
        assert "[]" in prompt


class TestDraftIsScrubbed:
    """The AI layer drops tags outside the vocabulary it was given, so a stray value
    never reaches the foreign keys."""

    def test_miss_is_upper_cased_and_kept_when_in_the_area(self):
        _, draft = _run(answer={"issue": {"title": "t", "description": "d", "miss": "slice"}})

        assert draft["issue"]["miss"] == "SLICE"

    def test_miss_from_another_area_is_dropped(self, db_session):
        db_session.add(
            models.TaxonomyMiss(key="CHUNK", area="CHIPPING", label="Chunk", golfer_label="I chunk it")
        )
        db_session.flush()
        taxonomy.prime_from(db_session)

        _, draft = _run(answer={"issue": {"title": "t", "description": "d", "miss": "CHUNK"}})

        assert draft["issue"]["miss"] is None

    def test_unknown_goals_are_dropped(self):
        answer = {"issue": {"title": "t", "description": "d", "goals": ["contact", "VIBES"]}}

        _, draft = _run(answer=answer)

        assert draft["issue"]["goals"] == ["CONTACT"]

    def test_answer_not_matching_the_draft_shape_raises(self):
        with pytest.raises(AIInvalidResponse):
            _run(answer={"drills": "not a list"})

    def test_empty_feedback_is_refused_before_calling_gemini(self):
        with patch.object(gemini, "generate_json") as call, pytest.raises(ValueError):
            coach_feedback.structure_coach_feedback(
                text="   ", area="FULL_SWING", allowed_misses=[], allowed_goals=[], model="m",
            )
        call.assert_not_called()
