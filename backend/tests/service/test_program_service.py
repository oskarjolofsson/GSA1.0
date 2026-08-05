from datetime import datetime, timezone, timedelta
from types import SimpleNamespace
from uuid import uuid4

import pytest

from core.services import program_service as ps
from core.services import exceptions
from core.services.dtos.program_service_dto import DrillGradeDTO


# ---------------- _allocate_slot (two-programs-per-area cap) ----------------
#
# The partial unique index programs_one_active_per_area_slot is what actually enforces the
# cap; these cover the half that produces a message the golfer can act on. The index's own
# behaviour is exercised in tests/integration/db.

class _FakeRepo:
    """Stands in for the programs repo so slot logic can be tested without building
    real programs, drill states and issues for every case."""

    def __init__(self, slots):
        self._programs = [SimpleNamespace(slot=s) for s in slots]

    def get_active_programs_by_area(self, user_id, area, session):
        return self._programs


class _FakeSession:
    """session.get(TaxonomyArea, key) is only touched on the failure path, to build the
    error message."""

    def get(self, model, key):
        return SimpleNamespace(golfer_label="Putting")


def _allocate(monkeypatch, slots):
    monkeypatch.setattr(ps, "repo", _FakeRepo(slots))
    return ps._allocate_slot(uuid4(), "PUTTING", _FakeSession())


def test_allocate_slot_takes_zero_when_area_is_empty(monkeypatch):
    assert _allocate(monkeypatch, []) == 0


def test_allocate_slot_takes_one_when_zero_is_held(monkeypatch):
    assert _allocate(monkeypatch, [0]) == 1


def test_allocate_slot_fills_the_gap_rather_than_appending(monkeypatch):
    """Holding only slot 1 (its neighbour completed) must reuse 0, not invent a slot 2 --
    the CHECK constraint only permits 0 and 1."""
    assert _allocate(monkeypatch, [1]) == 0


def test_allocate_slot_raises_when_both_slots_are_held(monkeypatch):
    with pytest.raises(exceptions.ConflictException):
        _allocate(monkeypatch, [0, 1])


def test_allocate_slot_message_names_the_area_in_golfer_language(monkeypatch):
    """The refusal has to say which area is full: a golfer with programs across four
    areas cannot act on "you already have two focuses"."""
    with pytest.raises(exceptions.ConflictException) as err:
        _allocate(monkeypatch, [0, 1])
    assert "putting" in str(err.value).lower()


def test_allocate_slot_survives_a_missing_taxonomy_row(monkeypatch):
    """Building the error message must never throw a second exception over the first."""

    class _EmptySession:
        def get(self, model, key):
            return None

    monkeypatch.setattr(ps, "repo", _FakeRepo([0, 1]))
    with pytest.raises(exceptions.ConflictException) as err:
        ps._allocate_slot(uuid4(), "FULL_SWING", _EmptySession())
    assert "full swing" in str(err.value).lower()


# ---------------- _pick_due_drills (spaced-repetition selection) ----------------

def _state(strength=0, last_seen_at=None):
    return SimpleNamespace(
        drill_id=uuid4(),
        strength=strength,
        last_seen_at=last_seen_at,
        times_seen=0,
        last_grade=None,
    )


def test_pick_due_drills_lowest_strength_first():
    low, mid, high = _state(0), _state(2), _state(4)
    picked = ps._pick_due_drills([high, mid, low], 2)
    assert picked == [low.drill_id, mid.drill_id]


def test_pick_due_drills_never_seen_before_seen_at_equal_strength():
    seen = _state(0, datetime(2026, 1, 1, tzinfo=timezone.utc))
    never_seen = _state(0, None)
    picked = ps._pick_due_drills([seen, never_seen], 1)
    assert picked == [never_seen.drill_id]


def test_pick_due_drills_ties_broken_by_oldest_last_seen():
    base = datetime(2026, 1, 1, tzinfo=timezone.utc)
    older = _state(1, base)
    newer = _state(1, base + timedelta(days=3))
    picked = ps._pick_due_drills([newer, older], 1)
    assert picked == [older.drill_id]


def test_pick_due_drills_respects_count_and_edge_cases():
    states = [_state(0), _state(1), _state(2)]
    assert len(ps._pick_due_drills(states, 2)) == 2
    assert ps._pick_due_drills(states, 0) == []
    assert ps._pick_due_drills([], 2) == []


def test_pick_due_drills_returns_all_when_fewer_than_count():
    # Issue with a single drill: asking for NUM_DRILLS_PER_RANGE returns just the one.
    single = _state(0)
    assert ps._pick_due_drills([single], ps.NUM_DRILLS_PER_RANGE) == [single.drill_id]


# ---------------- _next_strength (grade -> strength clamp) ----------------

def test_next_strength_dialed_increments_and_caps():
    assert ps._next_strength(0, "dialed") == 1
    assert ps._next_strength(ps.STRENGTH_MAX, "dialed") == ps.STRENGTH_MAX


def test_next_strength_ok_holds():
    assert ps._next_strength(2, "ok") == 2


def test_next_strength_rough_decrements_and_floors():
    assert ps._next_strength(2, "rough") == 1
    assert ps._next_strength(0, "rough") == 0


def test_next_strength_unknown_grade_is_noop():
    assert ps._next_strength(3, "banana") == 3


# ---------------- _resolve_grade (feel tap vs derived score) ----------------
#
# The scheduler has always run on a tapped rough/ok/dialed. Slice B lets a drill report a
# number instead, and the server -- not the phone -- decides what that number was worth.
# These cover the seam where the two meet.

_METRIC_10 = {"type": "make_rate", "reps": 10, "grade_at": {"dialed": 0.8, "ok": 0.5}}


def _grade(drill_id, **kw):
    return DrillGradeDTO(drill_id=drill_id, **kw)


def test_resolve_grade_passes_a_feel_tap_straight_through():
    drill_id = uuid4()
    assert ps._resolve_grade(_grade(drill_id, grade="rough"), {}) == "rough"


def test_resolve_grade_derives_from_a_raw_score():
    drill_id = uuid4()
    resolved = ps._resolve_grade(_grade(drill_id, metric_value=8), {drill_id: _METRIC_10})
    assert resolved == "dialed"


def test_resolve_grade_prefers_the_number_over_the_tap():
    # The measurement beats an opinion about the measurement. A well-behaved client never
    # sends both, but if one does, 3/10 is rough however good it felt.
    drill_id = uuid4()
    resolved = ps._resolve_grade(
        _grade(drill_id, grade="dialed", metric_value=3), {drill_id: _METRIC_10}
    )
    assert resolved == "rough"


def test_resolve_grade_survives_a_score_for_a_drill_with_no_metric():
    # Returns None -> _apply_grades skips it -> strength unchanged. The session still
    # records; only the grade is lost.
    drill_id = uuid4()
    assert ps._resolve_grade(_grade(drill_id, metric_value=8), {drill_id: None}) is None
