# tests/api/test_activity.py
"""
Activity endpoints — contribution-graph counts and per-day detail.

Seeding goes straight through `db_session` (the same connection the TestClient's
get_db override yields), so rows are visible to the API call and rolled back
after each test. user_id uses the real `test_user` (FK to auth.users).
"""
import uuid
from datetime import datetime, timezone

import pytest

from core.infrastructure.db.models.PracticeSession import PracticeSession
from core.infrastructure.db.models.PracticeDrillRun import PracticeDrillRun
from core.infrastructure.db.models.Analysis import Analysis
from core.infrastructure.db.models.Video import Video
from core.infrastructure.db.models.Drill import Drill
from core.services.activity_service import get_activity_counts


# =========== SEED HELPERS ===========

def _completed_session(db, user_id, completed_at, status="completed"):
    s = PracticeSession(
        user_id=user_id,
        status=status,
        started_at=completed_at,
        completed_at=completed_at if status == "completed" else None,
    )
    db.add(s)
    db.flush()
    return s


def _drill(db):
    d = Drill(title="Hip Hinge", task="t", success_signal="s", fault_indicator="f")
    db.add(d)
    db.flush()
    return d


def _drill_run(db, session_id, drill_id, completed_at):
    run = PracticeDrillRun(
        session_id=session_id,
        drill_id=drill_id,
        started_at=completed_at,
        completed_at=completed_at,
        successful_reps=8,
        failed_reps=4,
        skipped=False,
        order_index=0,
    )
    db.add(run)
    db.flush()
    return run


def _analysis(db, user_id, created_at, status="completed", success=True, thumbnail_key=None):
    video = Video(user_id=user_id, video_key="v/key.mp4", thumbnail_key=thumbnail_key)
    db.add(video)
    db.flush()
    a = Analysis(
        user_id=user_id,
        video_id=video.id,
        model_version="test-model",
        status=status,
        success=success,
        created_at=created_at,
    )
    db.add(a)
    db.flush()
    return a


# =========== /activity (counts) ===========

def test_counts_happy_path_sorted(client, test_user, db_session, auth_headers):
    user_id = test_user["user_id"]
    day_a = datetime(2026, 6, 15, 12, 0, tzinfo=timezone.utc)
    day_b = datetime(2026, 6, 17, 9, 0, tzinfo=timezone.utc)
    _completed_session(db_session, user_id, day_a)
    _completed_session(db_session, user_id, day_a.replace(hour=15))
    _analysis(db_session, user_id, day_b)

    resp = client.get("/api/v1/activity/?tz=UTC", headers=auth_headers)

    assert resp.status_code == 200
    data = resp.json()
    # Two sessions on the 15th share a bucket (same day, both unattributed); the
    # analysis on the 17th is its own row, attributed to full swing.
    assert data == [
        {"occurred_on": "2026-06-15", "area": None, "count": 2},
        {"occurred_on": "2026-06-17", "area": "FULL_SWING", "count": 1},
    ]


def test_counts_session_and_analysis_same_day_split_by_area(
    client, test_user, db_session, auth_headers
):
    """One day, two areas, two rows.

    This used to be a single row of count 2. Splitting by area is the point of the
    change — a client that only wants "did anything happen" sums the rows for a date.
    """
    user_id = test_user["user_id"]
    day = datetime(2026, 6, 15, 12, 0, tzinfo=timezone.utc)
    _completed_session(db_session, user_id, day)          # no issue -> unattributed
    _analysis(db_session, user_id, day.replace(hour=14))  # a filmed swing -> full swing

    resp = client.get("/api/v1/activity/?tz=UTC", headers=auth_headers)

    assert resp.status_code == 200
    data = resp.json()
    assert data == [
        {"occurred_on": "2026-06-15", "area": "FULL_SWING", "count": 1},
        {"occurred_on": "2026-06-15", "area": None, "count": 1},
    ]
    assert sum(row["count"] for row in data) == 2


def test_counts_excludes_non_completed(client, test_user, db_session, auth_headers):
    user_id = test_user["user_id"]
    day = datetime(2026, 6, 15, 12, 0, tzinfo=timezone.utc)
    _completed_session(db_session, user_id, day, status="in_progress")
    _analysis(db_session, user_id, day, status="completed", success=False)
    _analysis(db_session, user_id, day, status="processing", success=None)

    resp = client.get("/api/v1/activity/?tz=UTC", headers=auth_headers)

    assert resp.status_code == 200
    assert resp.json() == []


def test_counts_tz_boundary_flips_day(client, test_user, db_session, auth_headers):
    user_id = test_user["user_id"]
    # 22:30 UTC on the 15th -> 00:30 on the 16th in Stockholm (UTC+2 in June).
    _completed_session(db_session, user_id, datetime(2026, 6, 15, 22, 30, tzinfo=timezone.utc))

    utc = client.get("/api/v1/activity/?tz=UTC", headers=auth_headers).json()
    sto = client.get("/api/v1/activity/?tz=Europe/Stockholm", headers=auth_headers).json()

    assert utc == [{"occurred_on": "2026-06-15", "area": None, "count": 1}]
    assert sto == [{"occurred_on": "2026-06-16", "area": None, "count": 1}]


def test_counts_default_tz_is_utc(client, test_user, db_session, auth_headers):
    user_id = test_user["user_id"]
    _completed_session(db_session, user_id, datetime(2026, 6, 15, 22, 30, tzinfo=timezone.utc))

    resp = client.get("/api/v1/activity/", headers=auth_headers)

    assert resp.status_code == 200
    assert resp.json() == [{"occurred_on": "2026-06-15", "area": None, "count": 1}]


def test_counts_invalid_tz_returns_422(client, test_user, db_session, auth_headers):
    resp = client.get("/api/v1/activity/?tz=Not/AZone", headers=auth_headers)
    assert resp.status_code == 422


def test_counts_user_scoped(test_user, db_session):
    """A different user_id sees none of test_user's activity."""
    user_id = test_user["user_id"]
    _completed_session(db_session, user_id, datetime(2026, 6, 15, 12, 0, tzinfo=timezone.utc))

    other = get_activity_counts(user_id=uuid.uuid4(), tz="UTC", session=db_session)
    assert other == []


def test_counts_requires_auth(client):
    resp = client.get("/api/v1/activity/", headers={"Authorization": "Bearer invalid-token"})
    assert resp.status_code == 401


# =========== /activity/:date (detail) ===========

def test_day_detail_enriched(client, test_user, db_session, auth_headers):
    user_id = test_user["user_id"]
    day = datetime(2026, 6, 15, 12, 0, tzinfo=timezone.utc)
    session = _completed_session(db_session, user_id, day)
    drill = _drill(db_session)
    _drill_run(db_session, session.id, drill.id, day)
    _analysis(db_session, user_id, day.replace(hour=9), thumbnail_key="thumbs/x.jpg")

    resp = client.get("/api/v1/activity/2026-06-15/?tz=UTC", headers=auth_headers)

    assert resp.status_code == 200
    data = resp.json()
    assert data["date"] == "2026-06-15"
    assert len(data["sessions"]) == 1
    assert len(data["sessions"][0]["drill_runs"]) == 1
    run = data["sessions"][0]["drill_runs"][0]
    assert run["drill_title"] == "Hip Hinge"
    assert run["successful_reps"] == 8
    assert len(data["analyses"]) == 1
    assert data["analyses"][0]["thumbnail_url"] is not None


def test_day_detail_empty(client, test_user, db_session, auth_headers):
    resp = client.get("/api/v1/activity/2026-06-15/?tz=UTC", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json() == {"date": "2026-06-15", "sessions": [], "analyses": []}


def test_day_detail_excludes_other_days(client, test_user, db_session, auth_headers):
    user_id = test_user["user_id"]
    _completed_session(db_session, user_id, datetime(2026, 6, 14, 12, 0, tzinfo=timezone.utc))
    _completed_session(db_session, user_id, datetime(2026, 6, 16, 12, 0, tzinfo=timezone.utc))

    resp = client.get("/api/v1/activity/2026-06-15/?tz=UTC", headers=auth_headers)

    assert resp.status_code == 200
    assert resp.json()["sessions"] == []


def test_day_detail_malformed_date_422(client, test_user, db_session, auth_headers):
    resp = client.get("/api/v1/activity/not-a-date/?tz=UTC", headers=auth_headers)
    assert resp.status_code == 422


def test_day_detail_invalid_tz_422(client, test_user, db_session, auth_headers):
    resp = client.get("/api/v1/activity/2026-06-15/?tz=Bad/Zone", headers=auth_headers)
    assert resp.status_code == 422


def test_day_detail_requires_auth(client):
    resp = client.get(
        "/api/v1/activity/2026-06-15/", headers={"Authorization": "Bearer invalid-token"}
    )
    assert resp.status_code == 401


def test_day_detail_carries_feel_and_the_derived_grade(client, test_user, db_session, auth_headers):
    """The day sheet reads `feel` and `grade`, not `successful_reps`.

    That column carried a rough/ok/dialed ordinal and was labelled `good`, so three
    dialed blocks rendered as "9 good" next to a permanent "0 bad". The grade is
    re-derived here from the drill's current thresholds, same as everywhere else.
    """
    user_id = test_user["user_id"]
    day = datetime(2026, 6, 15, 12, 0, tzinfo=timezone.utc)
    session = _completed_session(db_session, user_id, day)
    drill = _drill(db_session)
    drill.metric = {"type": "make_rate", "reps": 10, "grade_at": {"dialed": 0.8, "ok": 0.5}}
    db_session.flush()

    run = _drill_run(db_session, session.id, drill.id, day)
    run.metric_value = 8
    run.metric_type = "make_rate"
    db_session.flush()

    resp = client.get("/api/v1/activity/2026-06-15/?tz=UTC", headers=auth_headers)

    assert resp.status_code == 200
    payload = resp.json()["sessions"][0]["drill_runs"][0]
    assert payload["metric_value"] == 8
    assert payload["metric_type"] == "make_rate"
    assert payload["grade"] == "dialed"


def test_day_detail_survives_a_run_whose_drill_was_deleted(client, test_user, db_session, auth_headers):
    """`drill_id` is nullable so deleting a drill does not delete the sessions the
    golfer actually practised. The day sheet has to render those runs, not 500 on them."""
    user_id = test_user["user_id"]
    day = datetime(2026, 6, 15, 12, 0, tzinfo=timezone.utc)
    session = _completed_session(db_session, user_id, day)
    drill = _drill(db_session)
    _drill_run(db_session, session.id, drill.id, day)

    db_session.delete(drill)
    db_session.flush()

    resp = client.get("/api/v1/activity/2026-06-15/?tz=UTC", headers=auth_headers)

    assert resp.status_code == 200
    payload = resp.json()["sessions"][0]["drill_runs"][0]
    assert payload["drill_id"] is None
    assert payload["drill_title"] == "Unknown Drill"


# =========== AREA GROUPING + DATE RANGE (C3) ===========

def _session_with_area(db, user_id, completed_at, area):
    """A completed session attributed to an area, as C2 stamps it at start."""
    s = _completed_session(db, user_id, completed_at)
    s.area = area
    db.flush()
    return s


def test_counts_split_one_day_across_areas(client, test_user, db_session, auth_headers):
    """The whole point: a day of putting and a day of range are not the same square."""
    user_id = test_user["user_id"]
    day = datetime(2026, 6, 15, 12, 0, tzinfo=timezone.utc)
    _session_with_area(db_session, user_id, day, "PUTTING")
    _session_with_area(db_session, user_id, day.replace(hour=15), "PUTTING")
    _session_with_area(db_session, user_id, day.replace(hour=17), "BUNKER")

    data = client.get("/api/v1/activity/?tz=UTC", headers=auth_headers).json()

    assert data == [
        {"occurred_on": "2026-06-15", "area": "BUNKER", "count": 1},
        {"occurred_on": "2026-06-15", "area": "PUTTING", "count": 2},
    ]


def test_unattributed_sorts_last_and_is_not_dropped(client, test_user, db_session, auth_headers):
    """A session with no issue behind it is real work. It gets its own bucket at the end
    of the day's rows, so the graph can render it as a distinct segment."""
    user_id = test_user["user_id"]
    day = datetime(2026, 6, 15, 12, 0, tzinfo=timezone.utc)
    _session_with_area(db_session, user_id, day, "PUTTING")
    _completed_session(db_session, user_id, day.replace(hour=16))  # no area

    data = client.get("/api/v1/activity/?tz=UTC", headers=auth_headers).json()

    assert [row["area"] for row in data] == ["PUTTING", None]


def test_range_is_inclusive_at_both_ends(client, test_user, db_session, auth_headers):
    """`to_date` includes the whole day, not up to its midnight.

    The bug this guards: a half-open window built from the raw date would exclude a
    session completed at 14:00 on the last day the caller asked for.
    """
    user_id = test_user["user_id"]
    for day in (14, 15, 16, 17):
        _session_with_area(
            db_session, user_id, datetime(2026, 6, day, 14, 0, tzinfo=timezone.utc), "PUTTING"
        )

    data = client.get(
        "/api/v1/activity/?tz=UTC&from_date=2026-06-15&to_date=2026-06-16",
        headers=auth_headers,
    ).json()

    assert [row["occurred_on"] for row in data] == ["2026-06-15", "2026-06-16"]


def test_range_bounds_are_independently_optional(client, test_user, db_session, auth_headers):
    user_id = test_user["user_id"]
    for day in (14, 15, 16):
        _session_with_area(
            db_session, user_id, datetime(2026, 6, day, 14, 0, tzinfo=timezone.utc), "PUTTING"
        )

    only_from = client.get(
        "/api/v1/activity/?tz=UTC&from_date=2026-06-15", headers=auth_headers
    ).json()
    only_to = client.get(
        "/api/v1/activity/?tz=UTC&to_date=2026-06-15", headers=auth_headers
    ).json()

    assert [row["occurred_on"] for row in only_from] == ["2026-06-15", "2026-06-16"]
    assert [row["occurred_on"] for row in only_to] == ["2026-06-14", "2026-06-15"]


def test_range_respects_the_timezone(client, test_user, db_session, auth_headers):
    """22:30 UTC on the 15th is 00:30 on the 16th in Stockholm, so a Stockholm range
    starting on the 16th includes it and a UTC one does not."""
    user_id = test_user["user_id"]
    _session_with_area(
        db_session, user_id, datetime(2026, 6, 15, 22, 30, tzinfo=timezone.utc), "PUTTING"
    )

    sto = client.get(
        "/api/v1/activity/?tz=Europe/Stockholm&from_date=2026-06-16", headers=auth_headers
    ).json()
    utc = client.get(
        "/api/v1/activity/?tz=UTC&from_date=2026-06-16", headers=auth_headers
    ).json()

    assert [row["occurred_on"] for row in sto] == ["2026-06-16"]
    assert utc == []


def test_inverted_range_is_422_not_an_empty_graph(client, test_user, db_session, auth_headers):
    """Silently returning [] would read as "you did no practice", which the caller has no
    way to tell apart from a range it got backwards."""
    resp = client.get(
        "/api/v1/activity/?from_date=2026-06-17&to_date=2026-06-15", headers=auth_headers
    )

    assert resp.status_code == 422
    assert "2026-06-17" in resp.text


def test_range_covers_analyses_too(client, test_user, db_session, auth_headers):
    """Both halves of the union are bounded, not just the practice half."""
    user_id = test_user["user_id"]
    _analysis(db_session, user_id, datetime(2026, 6, 14, 12, 0, tzinfo=timezone.utc))
    _analysis(db_session, user_id, datetime(2026, 6, 16, 12, 0, tzinfo=timezone.utc))

    data = client.get(
        "/api/v1/activity/?tz=UTC&from_date=2026-06-16", headers=auth_headers
    ).json()

    assert data == [{"occurred_on": "2026-06-16", "area": "FULL_SWING", "count": 1}]


def test_a_single_day_range_works(client, test_user, db_session, auth_headers):
    user_id = test_user["user_id"]
    for day in (15, 16):
        _session_with_area(
            db_session, user_id, datetime(2026, 6, day, 14, 0, tzinfo=timezone.utc), "CHIPPING"
        )

    data = client.get(
        "/api/v1/activity/?tz=UTC&from_date=2026-06-15&to_date=2026-06-15",
        headers=auth_headers,
    ).json()

    assert data == [{"occurred_on": "2026-06-15", "area": "CHIPPING", "count": 1}]
