"""Canonical practice-taxonomy vocabularies, defined once and reused everywhere.

Four orthogonal axes describe an issue for the goal-first library:
  * area  = WHERE in the game (course location)
  * miss  = WHAT the golfer sees (ball flight / strike) — the golfer-facing entry
  * goal  = WHY they practice (aspiration)
  * kind  = fault (a swing flaw) vs skill (a non-fault focus, e.g. clubhead speed)

These MUST stay in sync with the CHECK constraints on `issues.area`, `issues.kind`,
`issue_goals.goal`, and `issue_misses.miss`. The frontend constants file
(features/library/constants) mirrors the same values for display.
"""

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
