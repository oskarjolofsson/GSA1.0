"""The v2 analysis API: create -> upload -> start (202) -> poll -> details.

TestClient runs background tasks before returning, so the start request also runs the
job. The job is pointed at the test's own connection (a savepoint session) and R2,
ffmpeg, Gemini and the subscription check are stubbed, so the whole flow runs here
without leaving anything behind.
"""

import uuid
from contextlib import ExitStack
from unittest.mock import patch

import pytest
from fastapi import Depends

from app.api.v2.endpoints import analysis as endpoints
from app.dependencies.auth import get_current_user
from app.dependencies.entitlement import require_ai_access
from app.main import app
from core.infrastructure import ai
from core.infrastructure.db import models
from core.infrastructure.db.repositories.issues import create_issue
from core.infrastructure.db.session import SessionLocal
from core.services import analysis_v2_service as svc
from core.services import taxonomy

BASE = "/api/v2/analyses"


def _bypass_ai_access(current_user: dict = Depends(get_current_user)) -> dict:
    """Keeps the real caller but skips the subscription gate, like the v1 tests."""
    return current_user


@pytest.fixture(autouse=True)
def _premium():
    app.dependency_overrides[require_ai_access] = _bypass_ai_access
    yield
    app.dependency_overrides.pop(require_ai_access, None)


@pytest.fixture()
def vocab(db_session):
    """TEST_AREA / TEST_MISS -> TEST_LAW with one issue and one drill under it."""
    db_session.add(models.TaxonomyArea(key="TEST_AREA", label="t", golfer_label="t"))
    db_session.flush()
    db_session.add(models.TaxonomyMiss(key="TEST_MISS", area="TEST_AREA", label="t", golfer_label="t"))
    db_session.add(models.TaxonomyLaw(key="TEST_LAW", label="Test law", golfer_label="t"))
    db_session.flush()
    db_session.add(models.TaxonomyMissLaw(miss="TEST_MISS", law="TEST_LAW", rank=1))
    issue = create_issue(
        models.Issue(title="Over the top", description="d", area="TEST_AREA"), db_session
    )
    db_session.add(models.IssueLaw(issue_id=issue.id, law="TEST_LAW", rank=1))
    drill = models.Drill(title="Pump drill", task="t", success_signal="s", fault_indicator="f")
    db_session.add(drill)
    db_session.flush()
    db_session.add(models.IssueDrill(issue_id=issue.id, drill_id=drill.id))
    db_session.flush()
    taxonomy.prime_from(db_session)
    return issue


@pytest.fixture()
def world(db_session):
    """Stub everything outside the database and point the background job at the test's
    connection. `world.answer` is what the fake Gemini returns (or raises)."""
    state = type("World", (), {"answer": None, "uploaded": True})()

    def run_job(analysis_id):
        svc.execute_analysis(
            analysis_id,
            session_factory=lambda: SessionLocal(
                bind=db_session.get_bind(), join_transaction_mode="create_savepoint"
            ),
        )

    def fake_analyze(**kwargs):
        if isinstance(state.answer, Exception):
            raise state.answer
        return state.answer

    with ExitStack() as stack:
        stack.enter_context(patch.object(endpoints, "execute_analysis", run_job))
        stack.enter_context(patch.object(svc, "generate_upload_url", return_value="https://upload"))
        stack.enter_context(patch.object(svc, "object_exists", side_effect=lambda key: state.uploaded))
        stack.enter_context(patch.object(svc, "get_object", return_value=b"video-bytes"))
        stack.enter_context(patch.object(svc, "put_object"))
        stack.enter_context(patch.object(svc, "make_thumbnail_jpeg", return_value=b"jpeg"))
        stack.enter_context(patch.object(svc.entitlement_service, "is_subscribed", return_value=True))
        stack.enter_context(patch.object(ai, "analyze_swing", side_effect=fake_analyze))
        yield state


def _create(client, headers, **body):
    return client.post(f"{BASE}/", json={"area": "TEST_AREA", "miss": "TEST_MISS", **body}, headers=headers)


# ------------------------------ the whole flow ------------------------------


def test_create_start_poll_details(client, auth_headers, vocab, world):
    world.answer = {"observation": "o", "success": True, "law": "TEST_LAW",
                    "issues": [{"issue_id": str(vocab.id), "confidence": 0.8}]}

    created = _create(client, auth_headers, notes="driver only", club_type="driver", camera_view="face_on")
    assert created.status_code == 201, created.text
    analysis_id = created.json()["analysis_id"]
    assert created.json()["upload_url"] == "https://upload"

    assert client.get(f"{BASE}/{analysis_id}/", headers=auth_headers).json()["status"] == "awaiting_upload"

    started = client.post(f"{BASE}/{analysis_id}/start/", headers=auth_headers)
    assert started.status_code == 202, started.text
    assert started.json() == {"analysis_id": analysis_id, "status": "processing", "error_message": None}

    status = client.get(f"{BASE}/{analysis_id}/", headers=auth_headers).json()
    assert status["status"] == "completed", status

    details = client.get(f"{BASE}/{analysis_id}/details/", headers=auth_headers)
    assert details.status_code == 200, details.text
    body = details.json()
    assert (body["area"], body["miss"], body["law"]) == ("TEST_AREA", "TEST_MISS", "TEST_LAW")
    assert (body["notes"], body["club_type"], body["camera_view"]) == ("driver only", "driver", "face_on")
    assert [(i["issue_id"], i["confidence"]) for i in body["issues"]] == [(str(vocab.id), 0.8)]
    assert [d["title"] for d in body["issues"][0]["drills"]] == ["Pump drill"]


def test_a_failed_run_is_reported_through_status(client, auth_headers, vocab, world):
    world.answer = ai.AIVideoRejected("Gemini could not process the video.")
    analysis_id = _create(client, auth_headers).json()["analysis_id"]

    assert client.post(f"{BASE}/{analysis_id}/start/", headers=auth_headers).status_code == 202

    status = client.get(f"{BASE}/{analysis_id}/", headers=auth_headers).json()
    assert status["status"] == "failed"
    assert "could not process" in status["error_message"]
    assert client.get(f"{BASE}/{analysis_id}/details/", headers=auth_headers).status_code == 409


# ------------------------------ create ------------------------------


@pytest.mark.parametrize("body", [
    {"miss": "SLICE"},              # a real miss, from another area
    {"area": "NOT_AN_AREA"},
    {"camera_view": "behind"},
])
def test_create_refuses_invalid_input(client, auth_headers, vocab, world, body):
    assert _create(client, auth_headers, **body).status_code == 422


def test_create_requires_area_and_miss(client, auth_headers, world):
    response = client.post(f"{BASE}/", json={"area": "FULL_SWING"}, headers=auth_headers)

    assert response.status_code == 422


# ------------------------------ start ------------------------------


def test_start_before_upload_is_a_conflict(client, auth_headers, vocab, world):
    world.uploaded = False
    analysis_id = _create(client, auth_headers).json()["analysis_id"]

    response = client.post(f"{BASE}/{analysis_id}/start/", headers=auth_headers)

    assert response.status_code == 409
    assert client.get(f"{BASE}/{analysis_id}/", headers=auth_headers).json()["status"] == "awaiting_upload"


def test_starting_twice_is_a_conflict(client, auth_headers, vocab, world):
    world.answer = {"observation": "o", "success": True, "law": "TEST_LAW", "issues": []}
    analysis_id = _create(client, auth_headers).json()["analysis_id"]
    client.post(f"{BASE}/{analysis_id}/start/", headers=auth_headers)

    assert client.post(f"{BASE}/{analysis_id}/start/", headers=auth_headers).status_code == 409


# ------------------------------ reads ------------------------------


def test_details_before_completion_is_a_conflict(client, auth_headers, vocab, world):
    analysis_id = _create(client, auth_headers).json()["analysis_id"]

    assert client.get(f"{BASE}/{analysis_id}/details/", headers=auth_headers).status_code == 409


def test_unknown_analysis_is_not_found(client, auth_headers):
    assert client.get(f"{BASE}/{uuid.uuid4()}/", headers=auth_headers).status_code == 404


@pytest.mark.parametrize("path", ["", "details/", "start/"])
def test_someone_elses_analysis_is_forbidden(client, auth_headers, disposable_auth_headers, vocab, world, path):
    analysis_id = _create(client, auth_headers).json()["analysis_id"]
    method = client.post if path == "start/" else client.get

    assert method(f"{BASE}/{analysis_id}/{path}", headers=disposable_auth_headers).status_code == 403


def test_status_requires_authentication(client):
    """An invalid token is the 401 case; a missing header is FastAPI's 422, as in v1."""
    response = client.get(f"{BASE}/{uuid.uuid4()}/", headers={"Authorization": "Bearer invalid-token"})

    assert response.status_code == 401


# ------------------------------ subscription gate ------------------------------


@pytest.mark.parametrize("path", ["", "{id}/start/"])
def test_ai_endpoints_require_a_subscription(client, auth_headers, path):
    """No override here: test_user has no subscription, so the real gate answers."""
    app.dependency_overrides.pop(require_ai_access, None)

    response = client.post(f"{BASE}/{path.format(id=uuid.uuid4())}", json={"area": "FULL_SWING", "miss": "SLICE"},
                           headers=auth_headers)

    assert response.status_code == 402
