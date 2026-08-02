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

from core.infrastructure.db import models
from core.infrastructure.AI.google.feedbackStructurer import build_system_instructions
from core.services import taxonomy


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
