"""Canonical practice-taxonomy vocabularies, defined once and reused everywhere.

Four orthogonal axes describe an issue for the goal-first library:
  * area  = WHERE in the game (course location)
  * miss  = WHAT the golfer sees (ball flight / strike) — the golfer-facing entry
  * goal  = WHY they practice (aspiration)
  * kind  = fault (a swing flaw) vs skill (a non-fault focus, e.g. clubhead speed)

These MUST stay in sync with the CHECK constraints on `issues.area`, `issues.kind`,
`issue_goals.goal`, and `issue_misses.miss`.

Clients get these values from `GET /api/v1/taxonomy/` rather than hardcoding them, so
this module is the single source of truth for tag *membership*. Human-readable labels
stay client-side (the expo app's features/library/constants holds golfer-voice copy;
the admin uses its own terser labels) because they are presentation, not contract.
"""

from core.services.exceptions import ValidationException

ALLOWED_AREAS = ("FULL_SWING", "CHIPPING", "PUTTING", "BUNKER", "PITCHING")

ALLOWED_MISSES = ("SLICE", "HOOK", "PULL", "PUSH", "TOP", "THIN", "FAT", "LOW_WEAK")

ALLOWED_GOALS = ("STRAIGHTER", "DISTANCE", "CONTACT", "BIG_MISS", "SHORT_GAME", "PUTTING")

ALLOWED_KINDS = ("fault", "skill")

DEFAULT_AREA = "FULL_SWING"
DEFAULT_KIND = "fault"


def normalize_miss(value: str | None) -> str | None:
    """Return the miss if it's a known value, else None (drop unknowns silently)."""
    if value is None:
        return None
    v = value.strip().upper()
    return v if v in ALLOWED_MISSES else None


def normalize_goals(values) -> list[str]:
    """Keep only known goal values, de-duplicated, order preserved."""
    if not values:
        return []
    seen: list[str] = []
    for raw in values:
        if not raw:
            continue
        v = str(raw).strip().upper()
        if v in ALLOWED_GOALS and v not in seen:
            seen.append(v)
    return seen


# ---------------------------------------------------------------------------
# Strict variants — for admin authoring paths only.
#
# The lenient normalizers above drop unknown values and return success. That is
# right for the AI structurer (a hallucinated tag should degrade, not 500) and for
# user authoring. It is WRONG for the admin: an admin who ticks a tag and gets a
# 200 back has every reason to believe it saved. If the admin UI's vocabulary ever
# drifts from ALLOWED_*, silent-drop turns that into invisible data loss.
#
# These raise instead, which app/exception_handlers.py renders as 422 with a
# message naming the offending value.
# ---------------------------------------------------------------------------

def _normalize_strict(values, allowed: tuple[str, ...], label: str) -> list[str]:
    """De-duplicate and upper-case `values`, raising on anything not in `allowed`."""
    if not values:
        return []
    seen: list[str] = []
    for raw in values:
        if raw is None or str(raw).strip() == "":
            continue
        v = str(raw).strip().upper()
        if v not in allowed:
            raise ValidationException(
                f"Unknown {label} '{v}'. Allowed values: {', '.join(allowed)}."
            )
        if v not in seen:
            seen.append(v)
    return seen


def normalize_misses_strict(values) -> list[str]:
    """Validated miss tags. Raises ValidationException (422) on an unknown value."""
    return _normalize_strict(values, ALLOWED_MISSES, "miss")


def normalize_goals_strict(values) -> list[str]:
    """Validated goal tags. Raises ValidationException (422) on an unknown value."""
    return _normalize_strict(values, ALLOWED_GOALS, "goal")


def normalize_area_strict(value: str | None) -> str:
    """Validated area, defaulting when absent. Raises on an unknown value."""
    if value is None or str(value).strip() == "":
        return DEFAULT_AREA
    v = str(value).strip().upper()
    if v not in ALLOWED_AREAS:
        raise ValidationException(
            f"Unknown area '{v}'. Allowed values: {', '.join(ALLOWED_AREAS)}."
        )
    return v


def normalize_kind_strict(value: str | None) -> str:
    """Validated kind, defaulting when absent. Raises on an unknown value."""
    if value is None or str(value).strip() == "":
        return DEFAULT_KIND
    v = str(value).strip().lower()
    if v not in ALLOWED_KINDS:
        raise ValidationException(
            f"Unknown kind '{v}'. Allowed values: {', '.join(ALLOWED_KINDS)}."
        )
    return v
