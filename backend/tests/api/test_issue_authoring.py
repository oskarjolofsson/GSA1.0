"""
HTTP contract tests for the user-authored issue paths (coach feedback + browse)
and the issue_id program-generate path. Seeding goes through `db_session`; the AI
formatter is monkeypatched so no API key/network is needed. `/structure-feedback/`
is premium-gated, so we override `require_premium`.
"""
import pytest

from app.main import app
from app.dependencies.entitlement import require_premium

from core.infrastructure.db.models.Issue import Issue
from core.infrastructure.db.models.Drill import Drill
from core.infrastructure.db.models.IssueDrill import IssueDrill
from core.services import issue_authoring_service as ias


@pytest.fixture
def premium(test_user):
    app.dependency_overrides[require_premium] = lambda: {"user_id": str(test_user["user_id"])}
    yield
    app.dependency_overrides.pop(require_premium, None)


@pytest.fixture
def fake_ai(monkeypatch):
    def _s(text, image_bytes=None, image_mime=None):
        return {
            "issue": {"title": "Cast at the top", "description": "early release", "phase": "TRANSITION"},
            "drills": [{
                "title": "Pump drill", "task": "two pumps", "success_signal": "shallows",
                "fault_indicator": "casts", "ai_filled": [],
            }],
        }
    monkeypatch.setattr(ias, "_default_structurer", _s)


def test_structure_feedback_persists_nothing(client, premium, auth_headers, fake_ai, db_session):
    from core.infrastructure.db.repositories.issues import get_issue_count

    before = get_issue_count(db_session)
    resp = client.post(
        "/api/v1/issues/structure-feedback/",
        json={"text": "You cast from the top, do pump drills"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["issue"]["title"] == "Cast at the top"
    assert len(data["drills"]) == 1
    assert get_issue_count(db_session) == before  # nothing written


def test_create_custom_issue_then_generate_by_issue_id(client, premium, auth_headers):
    create = client.post(
        "/api/v1/issues/custom/",
        json={
            "issue": {"title": "Chicken wing", "description": "lead arm bends", "phase": "IMPACT"},
            "drills": [{"title": "Towel", "task": "t", "success_signal": "s", "fault_indicator": "f"}],
        },
        headers=auth_headers,
    )
    assert create.status_code == 201
    issue_id = create.json()["id"]
    assert create.json()["source"] == "custom"

    gen = client.post(
        "/api/v1/programs/generate/",
        json={"issue_id": issue_id},
        headers=auth_headers,
    )
    assert gen.status_code == 201
    body = gen.json()
    assert body["status"] == "active"
    assert body["issue_id"] == issue_id
    assert body["analysis_issue_id"] is None
    assert body["total_drills"] == 1


def test_generate_requires_an_id(client, premium, auth_headers):
    resp = client.post("/api/v1/programs/generate/", json={}, headers=auth_headers)
    assert resp.status_code == 422


def test_catalog_lists_global_issue(client, auth_headers, db_session):
    issue = Issue(title="Global sway", description="d")
    db_session.add(issue)
    db_session.flush()
    drill = Drill(title="Wall", task="t", success_signal="s", fault_indicator="f")
    db_session.add(drill)
    db_session.flush()
    db_session.add(IssueDrill(issue_id=issue.id, drill_id=drill.id))
    db_session.flush()

    resp = client.get("/api/v1/issues/catalog/", headers=auth_headers)
    assert resp.status_code == 200
    titles = {i["title"] for i in resp.json()}
    assert "Global sway" in titles
