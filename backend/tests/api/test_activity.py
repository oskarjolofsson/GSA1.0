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
    assert data == [
        {"occurred_on": "2026-06-15", "count": 2},
        {"occurred_on": "2026-06-17", "count": 1},
    ]


def test_counts_session_and_analysis_same_day_sum(client, test_user, db_session, auth_headers):
    user_id = test_user["user_id"]
    day = datetime(2026, 6, 15, 12, 0, tzinfo=timezone.utc)
    _completed_session(db_session, user_id, day)
    _analysis(db_session, user_id, day.replace(hour=14))

    resp = client.get("/api/v1/activity/?tz=UTC", headers=auth_headers)

    assert resp.status_code == 200
    assert resp.json() == [{"occurred_on": "2026-06-15", "count": 2}]


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

    assert utc == [{"occurred_on": "2026-06-15", "count": 1}]
    assert sto == [{"occurred_on": "2026-06-16", "count": 1}]


def test_counts_default_tz_is_utc(client, test_user, db_session, auth_headers):
    user_id = test_user["user_id"]
    _completed_session(db_session, user_id, datetime(2026, 6, 15, 22, 30, tzinfo=timezone.utc))

    resp = client.get("/api/v1/activity/", headers=auth_headers)

    assert resp.status_code == 200
    assert resp.json() == [{"occurred_on": "2026-06-15", "count": 1}]


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
