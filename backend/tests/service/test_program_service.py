from datetime import datetime, timezone, timedelta
from types import SimpleNamespace
from uuid import uuid4

from core.services import program_service as ps


# ---------------- _decide_next_type (scheduler cadence) ----------------

def _step(session_type):
    return SimpleNamespace(session_type=session_type)


def _run_schedule(n):
    """Simulate n consecutive scheduling decisions, appending each as a completed
    step so the next decision sees the realized history."""
    history = []
    seq = []
    for _ in range(n):
        t = ps._decide_next_type(history)
        seq.append(t)
        history.append(_step(t))
    return seq


def test_decide_next_type_starts_with_range_range_play():
    assert _run_schedule(3) == ["range", "range", "play"]


def test_decide_next_type_inserts_retest_after_cadence_work_sessions():
    seq = _run_schedule(2 * (ps.RETEST_CADENCE + 1))
    # First retest lands right after RETEST_CADENCE work sessions.
    assert seq[ps.RETEST_CADENCE] == "retest"
    assert "retest" not in seq[: ps.RETEST_CADENCE]


def test_decide_next_type_resets_counter_after_retest():
    seq = _run_schedule(20)
    retest_positions = [i for i, t in enumerate(seq) if t == "retest"]
    # At least two retests, and they are spaced by exactly RETEST_CADENCE work
    # sessions (i.e. RETEST_CADENCE + 1 slots apart).
    assert len(retest_positions) >= 2
    assert retest_positions[1] - retest_positions[0] == ps.RETEST_CADENCE + 1


def test_decide_next_type_work_cycle_repeats():
    seq = _run_schedule(20)
    work_only = [t for t in seq if t != "retest"]
    # The work rhythm is WORK_CYCLE repeated.
    for i, t in enumerate(work_only):
        assert t == ps.WORK_CYCLE[i % len(ps.WORK_CYCLE)]


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
