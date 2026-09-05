"""Ownership scoping on the practice session and drill run endpoints.

Regression tests for #164. Practice sessions and drill runs are per-user records, but
every endpoint that addressed one by id trusted the id alone: a caller holding a
session_id could read another user's session and results, complete it, and attach drill
runs to it, and a caller holding a drill_run_id could write rep counts into someone
else's run. The drill-run case takes its id from the request body, so no
path-parameter-shaped audit covers it.
"""

import pytest

from core.infrastructure.db.models import Drill, PracticeDrillRun, PracticeSession


@pytest.fixture()
def owned_session(db_session, test_user):
    """A practice session belonging to `test_user`, with one drill run in it."""
    drill = Drill(
        title="Ten six-footers",
        task="t",
        success_signal="s",
        fault_indicator="f",
    )
    db_session.add(drill)
    db_session.flush()

    session = PracticeSession(user_id=test_user["user_id"], status="in_progress")
    db_session.add(session)
    db_session.flush()

    run = PracticeDrillRun(session_id=session.id, drill_id=drill.id, order_index=0)
    db_session.add(run)
    db_session.flush()

    return session, run, drill


def test_get_practice_session_rejects_non_owner(client, owned_session, disposable_auth_headers):
    session, _run, _drill = owned_session

    response = client.get(
        f"/api/v1/practice/sessions/{session.id}/",
        headers=disposable_auth_headers,
    )

    assert response.status_code == 403, response.text


def test_get_practice_session_results_rejects_non_owner(client, owned_session, disposable_auth_headers):
    session, _run, _drill = owned_session

    response = client.get(
        f"/api/v1/practice/sessions/{session.id}/results/",
        headers=disposable_auth_headers,
    )

    assert response.status_code == 403, response.text


def test_complete_practice_session_rejects_non_owner(
    client, owned_session, disposable_auth_headers, db_session
):
    session, _run, _drill = owned_session

    response = client.post(
        f"/api/v1/practice/sessions/{session.id}/complete/",
        headers=disposable_auth_headers,
    )

    assert response.status_code == 403, response.text
    db_session.refresh(session)
    assert session.status == "in_progress"
    assert session.completed_at is None


def test_start_drill_run_rejects_non_owner(
    client, owned_session, disposable_auth_headers, db_session
):
    session, _run, drill = owned_session

    response = client.post(
        f"/api/v1/practice/sessions/{session.id}/drills/start/",
        json={"drill_id": str(drill.id), "order_index": 1},
        headers=disposable_auth_headers,
    )

    assert response.status_code == 403, response.text
    runs = (
        db_session.query(PracticeDrillRun)
        .filter(PracticeDrillRun.session_id == session.id)
        .all()
    )
    assert len(runs) == 1, "the rejected call must not have attached a run"


def test_complete_drill_run_rejects_non_owner(
    client, owned_session, disposable_auth_headers, db_session
):
    """The drill_run_id travels in the body here, not the path."""
    session, run, _drill = owned_session

    response = client.post(
        "/api/v1/practice/drill-runs/complete/",
        json={
            "id": str(run.id),
            "drill_title": "Ten six-footers",
            "session_id": str(session.id),
            "drill_id": str(_drill.id),
            "status": "in_progress",
            "started_at": "2026-01-01T00:00:00Z",
            "completed_at": None,
            "successful_reps": 9,
            "failed_reps": 1,
            "skipped": False,
        },
        headers=disposable_auth_headers,
    )

    assert response.status_code == 403, response.text
    db_session.refresh(run)
    assert run.completed_at is None
    assert run.feel is None
