"""Metric validation and grade derivation.

Two behaviours, and they fail in opposite directions on purpose:

  validate_metric  runs when an admin authors a drill, and is strict. A bad metric caught
                   here is a form error the author fixes in ten seconds.
  grade_for        runs when a golfer finishes practising, and is forgiving. Anything it
                   cannot make sense of returns None -- "leave strength alone" -- because
                   the alternative is refusing to record a session that already happened.

The thresholds under test are the authored defaults: on a 10-rep drill, 8-10 is dialed,
5-7 is ok, under 5 is rough.
"""

import pytest

from core.services import drill_metrics, exceptions


def make_rate(**over):
    return {"type": "make_rate", "reps": 10, **over}


# ======================= VALIDATION =======================


class TestValidateMetric:
    def test_none_is_a_feel_only_drill(self):
        assert drill_metrics.validate_metric(None) is None

    def test_fills_in_the_default_thresholds(self):
        # An author who does not care about thresholds should not have to invent them.
        assert drill_metrics.validate_metric(make_rate())["grade_at"] == {
            "dialed": 0.8,
            "ok": 0.5,
        }

    def test_rejects_a_non_object(self):
        with pytest.raises(exceptions.ValidationException):
            drill_metrics.validate_metric([1, 2, 3])

    def test_rejects_an_unknown_type_and_names_the_alternatives(self):
        with pytest.raises(exceptions.ValidationException) as err:
            drill_metrics.validate_metric({"type": "vibes", "reps": 10})
        assert "make_rate" in str(err.value)

    @pytest.mark.parametrize("reps", [None, "ten", 10.5, True, 0, -3])
    def test_rejects_reps_that_are_not_a_positive_whole_number(self, reps):
        # True is included deliberately: bool is an int in Python, so `reps: true` would
        # otherwise sail through isinstance and become a one-rep drill.
        with pytest.raises(exceptions.ValidationException):
            drill_metrics.validate_metric({"type": "make_rate", "reps": reps})

    @pytest.mark.parametrize("bad", [1.5, -0.1])
    def test_rejects_a_threshold_outside_zero_to_one(self, bad):
        with pytest.raises(exceptions.ValidationException) as err:
            drill_metrics.validate_metric(make_rate(grade_at={"dialed": bad, "ok": 0.5}))
        assert "proportion" in str(err.value)

    def test_rejects_ok_set_higher_than_dialed(self):
        # Inverted thresholds would make every score dialed or rough and nothing ok.
        with pytest.raises(exceptions.ValidationException) as err:
            drill_metrics.validate_metric(make_rate(grade_at={"dialed": 0.5, "ok": 0.9}))
        assert "easier bar" in str(err.value)

    def test_proximity_needs_a_unit(self):
        with pytest.raises(exceptions.ValidationException) as err:
            drill_metrics.validate_metric({"type": "proximity", "reps": 10})
        assert "unit" in str(err.value)

    def test_proximity_defaults_to_lower_is_better(self):
        metric = drill_metrics.validate_metric(
            {"type": "proximity", "reps": 10, "unit": "ft"}
        )
        assert metric["lower_is_better"] is True
        assert metric["ceiling"] == 10.0

    def test_strips_unknown_keys(self):
        # The stored JSONB is what every later read trusts, so it holds only what this
        # module understands -- an author's stray key cannot become load-bearing later.
        metric = drill_metrics.validate_metric(make_rate(nonsense="keep me"))
        assert "nonsense" not in metric

    def test_rejects_a_blank_label(self):
        with pytest.raises(exceptions.ValidationException):
            drill_metrics.validate_metric(make_rate(label="   "))


# ======================= GRADING =======================


class TestGradeFor:
    @pytest.mark.parametrize(
        "value,expected",
        [(10, "dialed"), (8, "dialed"), (7, "ok"), (5, "ok"), (4, "rough"), (0, "rough")],
    )
    def test_make_rate_grades_on_the_authored_boundaries(self, value, expected):
        metric = drill_metrics.validate_metric(make_rate())
        assert drill_metrics.grade_for(metric, value) == expected

    def test_thresholds_scale_to_the_rep_count(self):
        # The whole reason grade_at holds proportions: 16/20 is the same performance as
        # 8/10 and must grade the same, with no re-authoring.
        twenty = drill_metrics.validate_metric(make_rate(reps=20))
        assert drill_metrics.grade_for(twenty, 16) == "dialed"
        assert drill_metrics.grade_for(twenty, 10) == "ok"
        assert drill_metrics.grade_for(twenty, 9) == "rough"

    def test_respects_a_retuned_threshold(self):
        # This is what server-side grading buys: a stricter drill re-grades the same score
        # with no app release.
        strict = drill_metrics.validate_metric(make_rate(grade_at={"dialed": 0.9, "ok": 0.7}))
        assert drill_metrics.grade_for(strict, 8) == "ok"

    @pytest.mark.parametrize(
        "feet,expected", [(0, "dialed"), (2, "dialed"), (4, "ok"), (5, "ok"), (9, "rough")]
    )
    def test_proximity_inverts_the_scale(self, feet, expected):
        # Closer is better, so the raw number falls as the grade rises.
        metric = drill_metrics.validate_metric(
            {"type": "proximity", "reps": 10, "unit": "ft"}
        )
        assert drill_metrics.grade_for(metric, feet) == expected

    def test_proximity_beyond_the_ceiling_is_rough_not_negative(self):
        metric = drill_metrics.validate_metric(
            {"type": "proximity", "reps": 10, "unit": "ft"}
        )
        assert drill_metrics.grade_for(metric, 40) == "rough"

    def test_a_score_above_the_rep_count_is_clamped(self):
        # A client posting 12 out of 10 is buggy, not superhuman. Clamping keeps it at
        # dialed rather than letting the proportion exceed 1.
        assert drill_metrics.grade_for(drill_metrics.validate_metric(make_rate()), 12) == "dialed"

    def test_no_value_means_leave_strength_alone(self):
        # Matches what skipping the feel rating already does.
        assert drill_metrics.grade_for(make_rate(), None) is None

    def test_a_feel_only_drill_has_nothing_to_grade(self):
        assert drill_metrics.grade_for(None, 8) is None

    def test_an_unknown_type_is_survivable_at_practice_time(self):
        # The mirror of validate_metric's strictness. The CMS can add a metric type
        # without an app release, so an older build will post a value for a type this code
        # does not know. The golfer has already hit the balls -- returning None loses the
        # grade, refusing would lose the session.
        assert drill_metrics.grade_for({"type": "invented_later", "reps": 10}, 8) is None
