"""Entitlement-gate contract tests for the practice endpoints.

T1 (subscription-model rework): practice must be gate-free. `require_premium` was
removed entirely from `start_practice_session` and `start_drill_run` -- both now
depend on plain `get_current_user`. These tests prove an authenticated but
unsubscribed caller (the default `test_user`, who has no billing_subscription row)
can reach both endpoints with no 402, and that no entitlement dependency is left
wired up on this router at all.
"""

from core.infrastructure.db.models import Drill


def test_start_practice_session_has_no_entitlement_gate(client, auth_headers):
    """An unsubscribed user must be able to start free practice."""
    resp = client.post(
        "/api/v1/practice/sessions/start/",
        json={"session_type": "range"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    assert resp.status_code != 402


def test_start_drill_run_has_no_entitlement_gate(client, db_session, auth_headers):
    """An unsubscribed user must be able to start a drill run inside free practice."""
    drill = Drill(
        title="Ten six-footers",
        task="t",
        success_signal="s",
        fault_indicator="f",
    )
    db_session.add(drill)
    db_session.flush()

    session_resp = client.post(
        "/api/v1/practice/sessions/start/",
        json={"session_type": "range"},
        headers=auth_headers,
    )
    assert session_resp.status_code == 201
    session_id = session_resp.json()["id"]

    resp = client.post(
        f"/api/v1/practice/sessions/{session_id}/drills/start/",
        json={"drill_id": str(drill.id)},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    assert resp.status_code != 402


def test_practice_session_router_has_no_entitlement_dependency():
    """Static guard against the gate creeping back in: the router module must not
    import either entitlement dependency at all."""
    import app.api.v1.endpoints.practice_session as practice_session_endpoint

    assert not hasattr(practice_session_endpoint, "require_premium")
    assert not hasattr(practice_session_endpoint, "require_ai_access")
    assert not hasattr(practice_session_endpoint, "require_focus_capacity")
