"""The v2 analysis columns: structured inputs on prompts, the chosen law on analysis.

All of them are nullable so v1, which never writes them, keeps working. What the
database must still guarantee is that a value, once given, is a real taxonomy term or
an allowed club / camera value. That the miss belongs to the area is not a database
rule; the service checks it.
"""

import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from ....core.infrastructure.db.models.Analysis import Analysis
from ....core.infrastructure.db.models.Prompt import Prompt
from ....core.infrastructure.db.models.TaxonomyLaw import TaxonomyLaw
from ....core.infrastructure.db.models.TaxonomyMiss import TaxonomyMiss


@pytest.fixture()
def analysis(db_session, test_user) -> Analysis:
    row = Analysis(user_id=test_user["user_id"], model_version="test", status="awaiting_upload")
    db_session.add(row)
    db_session.flush()
    return row


def _prompt(db_session, analysis, **fields) -> Prompt:
    prompt = Prompt(analysis_id=analysis.id, **fields)
    db_session.add(prompt)
    db_session.flush()
    return prompt


class TestPromptInputs:
    def test_v2_inputs_round_trip(self, db_session, analysis):
        _prompt(
            db_session, analysis,
            area="FULL_SWING", miss="SLICE", notes="Only with the driver",
            club_type="driver", camera_view="down_the_line",
        )
        db_session.expunge_all()

        reloaded = db_session.get(Analysis, analysis.id).prompt

        assert (reloaded.area, reloaded.miss, reloaded.notes) == ("FULL_SWING", "SLICE", "Only with the driver")
        assert (reloaded.club_type, reloaded.camera_view) == ("driver", "down_the_line")

    def test_v1_prompt_leaves_every_v2_input_null(self, db_session, analysis):
        """v1 only writes the prompt_* columns. This is what keeps the shipped app working."""
        prompt = _prompt(db_session, analysis, prompt_misses="slice", prompt_extra="notes")

        assert (prompt.area, prompt.miss, prompt.notes, prompt.club_type, prompt.camera_view) == (
            None, None, None, None, None,
        )

    @pytest.mark.parametrize("field, value", [("area", "NOT_AN_AREA"), ("miss", "NOT_A_MISS")])
    def test_unknown_taxonomy_term_is_rejected(self, db_session, analysis, field, value):
        with pytest.raises(IntegrityError):
            _prompt(db_session, analysis, **{field: value})

    @pytest.mark.parametrize("field, value", [
        ("club_type", "spoon"),
        ("club_type", "Driver"),
        ("camera_view", "behind"),
        ("camera_view", "unknown"),
    ])
    def test_value_outside_the_allowed_list_is_rejected(self, db_session, analysis, field, value):
        """Case-sensitive, and no 'unknown': null already means not given."""
        with pytest.raises(IntegrityError):
            _prompt(db_session, analysis, **{field: value})

    def test_deleting_a_miss_an_analysis_was_made_with_is_refused(self, db_session, analysis):
        """RESTRICT: retire a miss with active = false instead."""
        db_session.add(TaxonomyMiss(key="TEST_MISS", area="FULL_SWING", label="t", golfer_label="t"))
        db_session.flush()
        _prompt(db_session, analysis, area="FULL_SWING", miss="TEST_MISS")

        with pytest.raises(IntegrityError):
            db_session.execute(text("DELETE FROM taxonomy_misses WHERE key = 'TEST_MISS'"))


class TestAnalysisLaw:
    def test_law_is_null_until_set(self, db_session, analysis):
        assert analysis.law is None

    def test_law_round_trips(self, db_session, analysis):
        analysis.law = "FACE"
        db_session.flush()
        db_session.expunge_all()

        assert db_session.get(Analysis, analysis.id).law == "FACE"

    def test_unknown_law_is_rejected(self, db_session, analysis):
        analysis.law = "NOT_A_LAW"

        with pytest.raises(IntegrityError):
            db_session.flush()

    def test_deleting_a_law_an_analysis_settled_on_is_refused(self, db_session, analysis):
        """RESTRICT: retire a law with active = false instead."""
        db_session.add(TaxonomyLaw(key="TEST_LAW", label="t", golfer_label="t"))
        db_session.flush()
        analysis.law = "TEST_LAW"
        db_session.flush()

        with pytest.raises(IntegrityError):
            db_session.execute(text("DELETE FROM taxonomy_laws WHERE key = 'TEST_LAW'"))
