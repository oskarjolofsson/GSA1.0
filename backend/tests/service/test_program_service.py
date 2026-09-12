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


# ---------------- deactivate_extra_focuses / reactivate_on_resub ----------------
#
# Fakes stand in for the repo and entitlement_service so the state-machine logic is
# tested without a real database. Slot preservation (T12) and the subscribed-user no-op
# (the critical safety check protecting the one live paying subscriber, T15) are both
# asserted directly on the fake Program objects passed through, not re-derived.

def _fake_program(created_at, status="active", area="PUTTING", slot=0, deactivated_at=None):
    return SimpleNamespace(
        id=uuid4(),
        status=status,
        created_at=created_at,
        area=area,
        slot=slot,
        deactivated_at=deactivated_at,
    )


class _FakeProgramsRepo:
    """Stands in for `core.infrastructure.db.repositories.programs`. `update_program` is
    a no-op because the fakes are already the objects `deactivate_extra_focuses` /
    `reactivate_on_resub` mutate in place -- same object identity in and out."""

    def __init__(self, programs):
        self.programs = programs
        self.updated: list = []

    def get_active_programs_by_user(self, user_id, session):
        return [p for p in self.programs if p.status == "active"]

    def get_programs_by_user(self, user_id, session):
        return list(self.programs)

    def update_program(self, program, session):
        self.updated.append(program)
        return program


class _FakeEntitlement:
    def __init__(self, subscribed: bool):
        self.subscribed = subscribed
        self.calls = 0

    def is_subscribed(self, user_id, session):
        self.calls += 1
        return self.subscribed


def _install(monkeypatch, programs, subscribed: bool):
    fake_repo = _FakeProgramsRepo(programs)
    fake_entitlement = _FakeEntitlement(subscribed)
    monkeypatch.setattr(ps, "repo", fake_repo)
    monkeypatch.setattr(ps, "entitlement_service", fake_entitlement)
    return fake_repo, fake_entitlement


_T0 = datetime(2026, 1, 1, tzinfo=timezone.utc)


def test_deactivate_extra_focuses_noops_with_zero_active(monkeypatch):
    repo_fake, ent = _install(monkeypatch, [], subscribed=False)
    ps.deactivate_extra_focuses(uuid4(), object(), trigger="lazy_check")
    assert repo_fake.updated == []


def test_deactivate_extra_focuses_noops_with_one_active(monkeypatch):
    programs = [_fake_program(_T0)]
    repo_fake, ent = _install(monkeypatch, programs, subscribed=False)
    ps.deactivate_extra_focuses(uuid4(), object(), trigger="lazy_check")
    assert repo_fake.updated == []
    assert programs[0].status == "active"


def test_deactivate_extra_focuses_keeps_oldest_deactivates_rest_and_preserves_slot(monkeypatch):
    """T4 + T12: the oldest active program survives untouched; every other active program
    is benched, and its `slot` is never touched -- required so reactivation can restore it
    to its original slot."""
    oldest = _fake_program(_T0, area="PUTTING", slot=0)
    newer1 = _fake_program(_T0 + timedelta(days=1), area="PUTTING", slot=1)
    newer2 = _fake_program(_T0 + timedelta(days=2), area="CHIPPING", slot=0)
    programs = [newer2, oldest, newer1]  # deliberately out of order
    repo_fake, ent = _install(monkeypatch, programs, subscribed=False)

    ps.deactivate_extra_focuses(uuid4(), object(), trigger="webhook")

    assert oldest.status == "active"
    assert oldest.deactivated_at is None

    for benched, expected_slot, expected_area in [(newer1, 1, "PUTTING"), (newer2, 0, "CHIPPING")]:
        assert benched.status == "inactive"
        assert benched.deactivated_at is not None
        assert benched.slot == expected_slot  # T12: slot untouched
        assert benched.area == expected_area

    assert {id(p) for p in repo_fake.updated} == {id(newer1), id(newer2)}


def test_deactivate_extra_focuses_noops_when_subscribed(monkeypatch):
    """T15 critical safety check: deactivate_extra_focuses checks entitlement itself and
    must never touch a subscribed user's programs, however many they hold."""
    programs = [_fake_program(_T0), _fake_program(_T0 + timedelta(days=1)), _fake_program(_T0 + timedelta(days=2))]
    original = [(p.status, p.slot, p.deactivated_at) for p in programs]
    repo_fake, ent = _install(monkeypatch, programs, subscribed=True)

    ps.deactivate_extra_focuses(uuid4(), object(), trigger="webhook")

    assert repo_fake.updated == []
    assert [(p.status, p.slot, p.deactivated_at) for p in programs] == original
    assert ent.calls == 1


def test_deactivate_extra_focuses_noops_during_grace_period(monkeypatch):
    """`is_subscribed` already honors the past_due/unpaid grace period (ADR-0006).
    deactivate_extra_focuses must use that same predicate, not a narrower one, so a
    lapsing-but-in-grace subscriber's extra focuses are not benched mid-retry."""
    programs = [_fake_program(_T0), _fake_program(_T0 + timedelta(days=1))]
    # `subscribed=True` here stands in for "is_subscribed returns True because the
    # subscription is in its past_due/unpaid grace window" -- from this function's point
    # of view that is indistinguishable from an ordinarily-active subscription, which is
    # exactly the point: it must not special-case grace.
    repo_fake, ent = _install(monkeypatch, programs, subscribed=True)

    ps.deactivate_extra_focuses(uuid4(), object(), trigger="lazy_check")

    assert repo_fake.updated == []
    assert all(p.status == "active" for p in programs)


def test_reactivate_on_resub_restores_oldest_first_when_slots_free(monkeypatch):
    oldest = _fake_program(_T0, status="inactive", area="PUTTING", slot=0, deactivated_at=_T0)
    newer = _fake_program(_T0 + timedelta(days=1), status="inactive", area="CHIPPING", slot=0, deactivated_at=_T0)
    programs = [newer, oldest]
    repo_fake, ent = _install(monkeypatch, programs, subscribed=True)

    ps.reactivate_on_resub(uuid4(), object())

    assert oldest.status == "active"
    assert oldest.deactivated_at is None
    assert oldest.slot == 0  # unchanged
    assert newer.status == "active"
    assert newer.deactivated_at is None
    assert newer.slot == 0  # unchanged -- different area, no collision


def test_reactivate_on_resub_skips_when_original_slot_is_now_taken(monkeypatch):
    """A brand-new program was started in the same (area, slot) while the golfer was
    unsubscribed. The benched program must NOT be reassigned to a different slot -- it
    stays inactive, and the skip is logged for support."""
    benched = _fake_program(_T0, status="inactive", area="PUTTING", slot=0, deactivated_at=_T0)
    occupier = _fake_program(_T0 + timedelta(days=5), status="active", area="PUTTING", slot=0)
    programs = [benched, occupier]
    repo_fake, ent = _install(monkeypatch, programs, subscribed=True)

    ps.reactivate_on_resub(uuid4(), object())

    assert benched.status == "inactive"
    assert benched.deactivated_at is not None
    assert benched.slot == 0  # never reassigned
    assert repo_fake.updated == []


def test_reactivate_on_resub_noops_with_no_inactive_programs(monkeypatch):
    programs = [_fake_program(_T0, status="active")]
    repo_fake, ent = _install(monkeypatch, programs, subscribed=True)
    ps.reactivate_on_resub(uuid4(), object())
    assert repo_fake.updated == []


def test_lapse_then_resub_full_cycle_restores_every_focus_when_slots_stayed_free(monkeypatch):
    """T15: the full lapse -> resub cycle for a genuinely unsubscribed user with multiple
    focuses. Oldest survives the lapse; nothing new claims the freed slots; resub restores
    every benched program, oldest first."""
    p1 = _fake_program(_T0, area="PUTTING", slot=0)
    p2 = _fake_program(_T0 + timedelta(days=1), area="PUTTING", slot=1)
    p3 = _fake_program(_T0 + timedelta(days=2), area="CHIPPING", slot=0)
    programs = [p1, p2, p3]
    repo_fake, ent = _install(monkeypatch, programs, subscribed=False)

    ps.deactivate_extra_focuses(uuid4(), object(), trigger="webhook")
    assert p1.status == "active"
    assert p2.status == "inactive" and p2.slot == 1
    assert p3.status == "inactive" and p3.slot == 0

    ent.subscribed = True
    ps.reactivate_on_resub(uuid4(), object())

    assert p1.status == "active"
    assert p2.status == "active" and p2.slot == 1 and p2.deactivated_at is None
    assert p3.status == "active" and p3.slot == 0 and p3.deactivated_at is None


# ---------------- _enforce_free_tier_focus_cap (T2: authoritative TOCTOU guard) ----------------

class _FakeCapSession:
    """Distinguishes the advisory-lock `text()` call from the `SELECT ... FOR UPDATE`
    call by statement shape, so both can be faked without a real database."""

    def __init__(self, active_ids):
        self._active_ids = active_ids
        self.advisory_lock_calls = 0

    def execute(self, stmt, params=None):
        if hasattr(stmt, "get_final_froms"):  # a Core Select construct
            return SimpleNamespace(scalars=lambda: SimpleNamespace(all=lambda: list(self._active_ids)))
        self.advisory_lock_calls += 1
        return None


def test_enforce_free_tier_cap_noops_when_subscribed(monkeypatch):
    monkeypatch.setattr(ps, "entitlement_service", _FakeEntitlement(subscribed=True))
    session = _FakeCapSession(active_ids=[uuid4(), uuid4()])
    ps._enforce_free_tier_focus_cap(uuid4(), session)  # must not raise
    assert session.advisory_lock_calls == 1


def test_enforce_free_tier_cap_allows_first_focus_when_unsubscribed(monkeypatch):
    monkeypatch.setattr(ps, "entitlement_service", _FakeEntitlement(subscribed=False))
    session = _FakeCapSession(active_ids=[])
    ps._enforce_free_tier_focus_cap(uuid4(), session)  # must not raise


def test_enforce_free_tier_cap_blocks_second_focus_when_unsubscribed(monkeypatch):
    monkeypatch.setattr(ps, "entitlement_service", _FakeEntitlement(subscribed=False))
    session = _FakeCapSession(active_ids=[uuid4()])
    with pytest.raises(exceptions.FocusLimitExceeded):
        ps._enforce_free_tier_focus_cap(uuid4(), session)
