"""Canonical practice-taxonomy vocabularies, read from the database.

Four axes describe an issue: area (WHERE in the game), miss (WHAT the golfer sees,
scoped to one area), goal (WHY they practice) and kind (fault vs skill).

Validators are pure and read a process-level cache, so admin writes must call
`reset_cache()` and tests must start cold. See ADR-0001.
"""

from __future__ import annotations

from dataclasses import dataclass

from core.services.dtos.taxonomy_dto import (
    TaxonomyMissDTO,
    TaxonomyTermDTO,
    TaxonomyVocabularyDTO,
)
from core.services.exceptions import ValidationException

# Not table-driven. `kind` distinguishes a diagnosable fault from a non-fault training
# focus, which decides which branch of the library an issue appears under. It is a
# structural flag, not vocabulary anyone authors.
ALLOWED_KINDS = ("fault", "skill")
DEFAULT_KIND = "fault"

# Likewise a behavioural default rather than vocabulary: an issue created without an area
# is a full-swing issue. Deleting this area is blocked by RESTRICT while any issue uses it.
DEFAULT_AREA = "FULL_SWING"


@dataclass(frozen=True)
class _Vocabulary:
    """One immutable snapshot of the taxonomy tables."""

    areas: tuple[str, ...]
    goals: tuple[str, ...]
    misses: tuple[str, ...]                     # every miss, flat, across all areas
    misses_by_area: dict[str, tuple[str, ...]]
    area_of_miss: dict[str, str]


_CACHE: _Vocabulary | None = None


def _load(session=None) -> _Vocabulary:
    """Read the three taxonomy tables into an immutable snapshot.

    With no `session` it opens its own, because the callers are pure validators with no
    session in scope and this runs once per process against three tables holding a few
    dozen rows.

    Pass one to read through an existing transaction — see `prime_from`.

    Only `active` rows are returned. Deleting a value is blocked by RESTRICT once any issue
    references it, so `active = false` is how a value is taken out of circulation without
    disturbing content that already uses it.
    """
    from contextlib import nullcontext

    from core.infrastructure.db.repositories import taxonomy as taxonomy_repo
    from core.infrastructure.db.session import SessionLocal

    # nullcontext so a caller-supplied session is not closed out from under them.
    with (nullcontext(session) if session is not None else SessionLocal()) as session:
        areas = tuple(taxonomy_repo.list_active_area_keys(session))
        goals = tuple(taxonomy_repo.list_active_goal_keys(session))
        miss_rows = taxonomy_repo.list_active_miss_keys_with_area(session)

    by_area: dict[str, list[str]] = {area: [] for area in areas}
    area_of: dict[str, str] = {}
    for key, area in miss_rows:
        by_area.setdefault(area, []).append(key)
        area_of[key] = area

    return _Vocabulary(
        areas=areas,
        goals=goals,
        misses=tuple(key for key, _ in miss_rows),
        misses_by_area={a: tuple(m) for a, m in by_area.items()},
        area_of_miss=area_of,
    )


def _vocab() -> _Vocabulary:
    global _CACHE
    if _CACHE is None:
        _CACHE = _load()
    return _CACHE


def reset_cache() -> None:
    """Drop the cached vocabulary so the next read reloads it.

    Call after any admin write to the taxonomy tables. Tests call it around every test via
    an autouse fixture — see tests/conftest.py.

    The reload opens a fresh session, so it sees committed rows only. That is right for
    production, where the request has committed by the time anything reads again, but a
    test writing through the rolling-back `db_session` needs `prime_from` instead.
    """
    global _CACHE
    _CACHE = None


def prime_from(session) -> None:
    """Reload the vocabulary cache through an existing session. Tests only.

    A test's writes live in an uncommitted transaction, so the fresh session `reset_cache`
    opens cannot see them. Production commits, where `reset_cache` is enough.

    Import this module absolutely (`from core.services import taxonomy`); a relative import
    resolves to a separate module object with its own `_CACHE`, and priming that one fails
    as "the vocabulary is empty".
    """
    global _CACHE
    _CACHE = _load(session)


# =========== READ ACCESSORS ===========
#
# Functions rather than module constants on purpose. `from taxonomy import ALLOWED_MISSES`
# would snapshot the tuple at import time and never see an admin edit — which is exactly
# the bug feedbackStructurer.py had, baking the list into a Gemini prompt at module load.


def allowed_areas() -> tuple[str, ...]:
    return _vocab().areas


def allowed_goals() -> tuple[str, ...]:
    return _vocab().goals


def allowed_misses() -> tuple[str, ...]:
    """Every miss across every area. Prefer `misses_for(area)` where an area is known."""
    return _vocab().misses


def misses_for(area: str) -> tuple[str, ...]:
    """The misses belonging to `area`. Raises ValidationException on an unknown area."""
    v = _vocab()
    key = _normalize_key(area)
    if key not in v.areas:
        raise ValidationException(
            f"Unknown area '{key}'. Allowed values: {', '.join(v.areas)}."
        )
    return v.misses_by_area.get(key, ())


def area_of_miss(miss: str) -> str | None:
    """Which area a miss belongs to, or None if it is not a known miss."""
    return _vocab().area_of_miss.get(_normalize_key(miss))


def _normalize_key(value: str) -> str:
    return str(value).strip().upper()


# =========== LENIENT NORMALIZERS ===========
#
# For machine-generated input (the AI structurer). Unknown values are dropped rather than
# raised on: a model returning one bad tag should not fail the whole request.


def normalize_miss(value: str | None) -> str | None:
    """Return the miss if it is known, else None. Not area-scoped."""
    if value is None:
        return None
    key = _normalize_key(value)
    return key if key in _vocab().misses else None


def normalize_goals(values) -> list[str]:
    """Keep only known goal values, de-duplicated, order preserved."""
    if not values:
        return []
    allowed = _vocab().goals
    seen: list[str] = []
    for raw in values:
        if not raw:
            continue
        key = _normalize_key(raw)
        if key in allowed and key not in seen:
            seen.append(key)
    return seen


# =========== STRICT NORMALIZERS ===========
#
# For human authoring. These raise ValidationException (422) instead of dropping, so a tag
# the admin deliberately picked never disappears silently.


def _normalize_strict(values, allowed, label: str) -> list[str]:
    """De-duplicate and upper-case `values`, raising on anything not in `allowed`."""
    if not values:
        return []
    seen: list[str] = []
    for raw in values:
        if raw is None or str(raw).strip() == "":
            continue
        key = _normalize_key(raw)
        if key not in allowed:
            raise ValidationException(
                f"Unknown {label} '{key}'. Allowed values: {', '.join(allowed)}."
            )
        if key not in seen:
            seen.append(key)
    return seen


def normalize_misses_strict(values, area: str) -> list[str]:
    """Validated miss tags for one area.

    Raises ValidationException (422) on an unknown miss, and on a miss that exists but
    belongs to a different area — tagging a putting issue SLICE is refused, and the message
    says which area it actually belongs to rather than just listing the legal values.

    `area` is required. Every caller has one: create computes it before tagging, and the
    PATCH path resolves it from the persisted issue when the request omits it. Making it
    optional would let the edit path accept what the create path rejects.
    """
    if not values:
        return []

    v = _vocab()
    key_area = _normalize_key(area)
    if key_area not in v.areas:
        raise ValidationException(
            f"Unknown area '{key_area}'. Allowed values: {', '.join(v.areas)}."
        )

    in_area = v.misses_by_area.get(key_area, ())
    seen: list[str] = []
    for raw in values:
        if raw is None or str(raw).strip() == "":
            continue
        key = _normalize_key(raw)
        if key in in_area:
            if key not in seen:
                seen.append(key)
            continue

        owner = v.area_of_miss.get(key)
        if owner is not None:
            raise ValidationException(
                f"Miss '{key}' belongs to {owner}, not {key_area}. "
                f"Allowed for {key_area}: {', '.join(in_area) or '(none yet)'}."
            )
        raise ValidationException(
            f"Unknown miss '{key}'. Allowed for {key_area}: "
            f"{', '.join(in_area) or '(none yet)'}."
        )
    return seen


def normalize_goals_strict(values) -> list[str]:
    """Validated goal tags. Raises ValidationException (422) on an unknown value."""
    return _normalize_strict(values, _vocab().goals, "goal")


def normalize_area_strict(value: str | None) -> str:
    """Validated area, defaulting when absent. Raises on an unknown value."""
    if value is None or str(value).strip() == "":
        return DEFAULT_AREA
    key = _normalize_key(value)
    areas = _vocab().areas
    if key not in areas:
        raise ValidationException(
            f"Unknown area '{key}'. Allowed values: {', '.join(areas)}."
        )
    return key


def normalize_area_optional(value: str | None) -> str | None:
    """Validated area where absent means *no* area, rather than the default one.

    Issues live somewhere on the course, so `normalize_area_strict` defaults a missing
    area to FULL_SWING. A drill does not have to: mirror work and tempo drills belong to
    every area, and defaulting them into full swing would quietly hide them from the
    short-game library the moment Slice C starts filtering by area.
    """
    if value is None or str(value).strip() == "":
        return None
    return normalize_area_strict(value)


def normalize_kind_strict(value: str | None) -> str:
    """Validated kind, defaulting when absent. Raises on an unknown value."""
    if value is None or str(value).strip() == "":
        return DEFAULT_KIND
    key = str(value).strip().lower()
    if key not in ALLOWED_KINDS:
        raise ValidationException(
            f"Unknown kind '{key}'. Allowed values: {', '.join(ALLOWED_KINDS)}."
        )
    return key


def get_vocabulary(session) -> TaxonomyVocabularyDTO:
    """Every vocabulary with its display labels, for the clients' tag pickers.

    Reads the rows rather than the validator cache above. The cache holds keys only,
    because that is all the validators need; this serves labels too.

    Every area gets an entry in `misses_by_area`, including empty ones: a client
    rendering an area grid needs to know an area exists with nothing in it yet
    ("Coming soon") rather than having it silently absent.
    """
    from core.infrastructure.db.repositories import taxonomy as taxonomy_repo

    def term(row) -> TaxonomyTermDTO:
        return TaxonomyTermDTO(
            key=row.key,
            label=row.label,
            golfer_label=row.golfer_label,
            blurb=row.blurb,
            sort=row.sort,
        )

    def miss(row) -> TaxonomyMissDTO:
        return TaxonomyMissDTO(
            key=row.key,
            area=row.area,
            label=row.label,
            golfer_label=row.golfer_label,
            blurb=row.blurb,
            sort=row.sort,
        )

    areas = taxonomy_repo.list_active_areas(session)
    misses = [miss(m) for m in taxonomy_repo.list_active_misses(session)]

    by_area: dict[str, list[TaxonomyMissDTO]] = {a.key: [] for a in areas}
    for m in misses:
        by_area.setdefault(m.area, []).append(m)

    return TaxonomyVocabularyDTO(
        areas=[term(a) for a in areas],
        goals=[term(g) for g in taxonomy_repo.list_active_goals(session)],
        misses=misses,
        misses_by_area=by_area,
        kinds=list(ALLOWED_KINDS),
        default_area=DEFAULT_AREA,
        default_kind=DEFAULT_KIND,
    )
