"""Validating a drill's metric, and turning a raw score into a grade.

Grades are derived here and nowhere else — the client posts the raw number only.
Thresholds are proportions, so they hold at any rep count. See ADR-0002.
"""

from __future__ import annotations

from typing import Any

from core.services import exceptions

# --------------------------------------------------------------------------------------
# Vocabulary
# --------------------------------------------------------------------------------------

MAKE_RATE = "make_rate"
PROXIMITY = "proximity"
UP_AND_DOWN = "up_and_down"

#: Metric types this build understands. Deliberately a small closed set: every entry needs
#: a rating UI in the app, so adding one here without shipping that UI is what B2's default
#: branch exists to survive.
KNOWN_TYPES: frozenset[str] = frozenset({MAKE_RATE, PROXIMITY, UP_AND_DOWN})

#: Types where the golfer's score is a count out of `reps`, so the proportion is
#: value / reps. PROXIMITY is the odd one out -- feet from the hole has no natural ceiling.
_COUNT_TYPES: frozenset[str] = frozenset({MAKE_RATE, UP_AND_DOWN})

GRADE_DIALED = "dialed"
GRADE_OK = "ok"
GRADE_ROUGH = "rough"

#: Authoring defaults, matching the admin form's pre-fill. 80% dialed, 50% ok.
DEFAULT_GRADE_AT: dict[str, float] = {GRADE_DIALED: 0.8, GRADE_OK: 0.5}

#: Ceiling for a proximity drill's normalised score, in the drill's own unit. A putt left
#: 10 feet away and one left 40 feet away are both simply bad; without a cap, one wild
#: result would drag an otherwise good session to zero.
_PROXIMITY_CEILING_DEFAULT = 10.0


# --------------------------------------------------------------------------------------
# Validation
# --------------------------------------------------------------------------------------


def validate_metric(metric: Any) -> dict | None:
    """Check an authored metric and return it normalised, or None for a feel-only drill.

    Raises ValidationException with a message written for the admin composing the drill, not
    for a log file -- this is reached from the drill form, where the person reading it can
    fix the problem immediately.
    """
    if metric is None:
        return None

    if not isinstance(metric, dict):
        raise exceptions.ValidationException(
            "A drill's metric has to be an object, or empty for a feel-only drill."
        )

    kind = metric.get("type")
    if kind not in KNOWN_TYPES:
        known = ", ".join(sorted(KNOWN_TYPES))
        raise exceptions.ValidationException(
            f"Unknown metric type {kind!r}. Pick one of: {known}."
        )

    reps = metric.get("reps")
    # bool is an int in Python, and `True` reaching reps means the payload is malformed.
    if isinstance(reps, bool) or not isinstance(reps, int):
        raise exceptions.ValidationException(
            "A metric needs a whole number of reps -- how many attempts the golfer makes."
        )
    if reps < 1:
        raise exceptions.ValidationException("A metric needs at least one rep.")

    grade_at = _validate_grade_at(metric.get("grade_at"))

    normalised: dict[str, Any] = {"type": kind, "reps": reps, "grade_at": grade_at}

    label = metric.get("label")
    if label is not None:
        if not isinstance(label, str) or not label.strip():
            raise exceptions.ValidationException("A metric's label can't be blank.")
        normalised["label"] = label.strip()

    if kind == PROXIMITY:
        unit = metric.get("unit")
        if not isinstance(unit, str) or not unit.strip():
            raise exceptions.ValidationException(
                "A proximity metric needs a unit, so the golfer knows what the number means."
            )
        normalised["unit"] = unit.strip()
        # Distance-to-hole is the one metric where smaller wins. Stored explicitly rather
        # than inferred from the type so a future "shots gained"-style metric can opt in.
        normalised["lower_is_better"] = bool(metric.get("lower_is_better", True))

        ceiling = metric.get("ceiling", _PROXIMITY_CEILING_DEFAULT)
        if not isinstance(ceiling, (int, float)) or isinstance(ceiling, bool) or ceiling <= 0:
            raise exceptions.ValidationException(
                "A proximity metric's ceiling has to be a positive number."
            )
        normalised["ceiling"] = float(ceiling)

    return normalised


def _validate_grade_at(raw: Any) -> dict[str, float]:
    """Thresholds as proportions of a perfect score, so they scale to any rep count."""
    if raw is None:
        return dict(DEFAULT_GRADE_AT)

    if not isinstance(raw, dict):
        raise exceptions.ValidationException("grade_at has to be an object with dialed and ok.")

    out: dict[str, float] = {}
    for name in (GRADE_DIALED, GRADE_OK):
        value = raw.get(name, DEFAULT_GRADE_AT[name])
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise exceptions.ValidationException(f"grade_at.{name} has to be a number.")
        if not 0 <= value <= 1:
            raise exceptions.ValidationException(
                f"grade_at.{name} is a proportion between 0 and 1 "
                f"(0.8 means 8 out of 10), got {value}."
            )
        out[name] = float(value)

    if out[GRADE_OK] > out[GRADE_DIALED]:
        raise exceptions.ValidationException(
            "grade_at.ok can't be higher than grade_at.dialed -- ok is the easier bar."
        )

    return out


# --------------------------------------------------------------------------------------
# Grading
# --------------------------------------------------------------------------------------


def grade_for(metric: Any, value: float | None) -> str | None:
    """Grade a raw score against its drill's thresholds.

    Returns None when there is nothing to grade -- no metric, or no value recorded because
    the golfer skipped the rating. None means "leave this drill's strength alone", matching
    what an unrated feel block already does.

    An unknown metric type also returns None rather than raising. By the time a run reaches
    here the golfer has already finished practising, and refusing to record their session
    because the catalog moved on under them is the one outcome worth avoiding.
    """
    if not isinstance(metric, dict) or value is None:
        return None

    kind = metric.get("type")
    if kind not in KNOWN_TYPES:
        return None

    score = _normalised_score(metric, float(value))
    if score is None:
        return None

    grade_at = metric.get("grade_at") or DEFAULT_GRADE_AT
    dialed = grade_at.get(GRADE_DIALED, DEFAULT_GRADE_AT[GRADE_DIALED])
    ok = grade_at.get(GRADE_OK, DEFAULT_GRADE_AT[GRADE_OK])

    if score >= dialed:
        return GRADE_DIALED
    if score >= ok:
        return GRADE_OK
    return GRADE_ROUGH


def _normalised_score(metric: dict, value: float) -> float | None:
    """Collapse a raw score to 0.0-1.0, where 1.0 is perfect.

    Everything downstream compares proportions, so this is where "8 made out of 10" and
    "4.2 feet from the hole" become commensurable.
    """
    kind = metric.get("type")

    if kind in _COUNT_TYPES:
        reps = metric.get("reps")
        if not isinstance(reps, int) or reps < 1:
            return None
        # Clamped: a client that posts 11 out of 10 is buggy, not superhuman.
        return max(0.0, min(1.0, value / reps))

    if kind == PROXIMITY:
        ceiling = metric.get("ceiling", _PROXIMITY_CEILING_DEFAULT)
        if not isinstance(ceiling, (int, float)) or ceiling <= 0:
            ceiling = _PROXIMITY_CEILING_DEFAULT
        # Distance in, quality out: dead weight at the hole is 1.0, at or beyond the
        # ceiling is 0.0. `lower_is_better` is honoured rather than assumed so the same
        # branch serves a future metric where a bigger number wins.
        if metric.get("lower_is_better", True):
            return max(0.0, min(1.0, 1.0 - (value / ceiling)))
        return max(0.0, min(1.0, value / ceiling))

    return None


def describe(metric: Any) -> str | None:
    """The golfer-facing name for what is being counted, for a results screen heading."""
    if not isinstance(metric, dict):
        return None
    label = metric.get("label")
    if isinstance(label, str) and label.strip():
        return label.strip()
    return {
        MAKE_RATE: "Made",
        PROXIMITY: "Average distance",
        UP_AND_DOWN: "Up and downs",
    }.get(metric.get("type"))
