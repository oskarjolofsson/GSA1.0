"""
Program engine HTTP contract tests.

Seeding goes straight through `db_session` (the same connection the TestClient's
get_db override yields), so rows are visible to the API call and rolled back
after each test. user_id uses the real `test_user` (FK to auth.users). The
`/generate/` route is premium-gated, so we override `require_premium`.
"""
import uuid
import pytest

from app.main import app
from app.dependencies.entitlement import require_premium

from core.infrastructure.db.models.Issue import Issue
from core.infrastructure.db.models.Drill import Drill
from core.infrastructure.db.models.IssueDrill import IssueDrill
from core.infrastructure.db.models.Analysis import Analysis
from core.infrastructure.db.models.AnalysisIssue import AnalysisIssue


@pytest.fixture
def premium(test_user):
    app.dependency_overrides[require_premium] = lambda: {"user_id": str(test_user["user_id"])}
    yield
    app.dependency_overrides.pop(require_premium, None)


@pytest.fixture
def analysis_issue_id(db_session, test_user):
    """Seed an owned analysis issue with 3 linked drills; return its id."""
    issue = Issue(title="Early extension", description="d", phase="IMPACT")
    db_session.add(issue)
    db_session.flush()
    for i in range(3):
        drill = Drill(title=f"Drill {i}", task="t", success_signal="s", fault_indicator="f")
        db_session.add(drill)
        db_session.flush()
        db_session.add(IssueDrill(issue_id=issue.id, drill_id=drill.id))
    analysis = Analysis(user_id=test_user["user_id"], model_version="v1.0")
    db_session.add(analysis)
    db_session.flush()
    ai = AnalysisIssue(analysis_id=analysis.id, issue_id=issue.id, confidence=0.9)
    db_session.add(ai)
    db_session.flush()
    return ai.id


def _generate(client, headers, issue_id):
    return client.post(
        "/api/v1/programs/generate/",
        json={"analysis_issue_id": str(issue_id)},
        headers=headers,
    )


def test_generate_creates_program(client, premium, auth_headers, analysis_issue_id):
    """
    Creates an analysis issue with 3 drills
    Generates a program for the issue using the API
    Tests that the program is active, has 3 drills, and all drill states are initialized
    """
    resp = _generate(client, auth_headers, analysis_issue_id)
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "active"
    assert data["total_drills"] == 3
    assert data["grooved_count"] == 0
    assert data["steps"] == []


def test_generate_is_idempotent(client, premium, auth_headers, analysis_issue_id):
    """
    Creates an analysis issue with 3 drills
    Generates a program for the issue using the API twice
    Tests that the two calls return the same program id (no duplicate programs)
    """
    first = _generate(client, auth_headers, analysis_issue_id).json()
    second = _generate(client, auth_headers, analysis_issue_id).json()
    assert first["id"] == second["id"]


def test_active_program_endpoint(client, premium, auth_headers, analysis_issue_id):
    """
    Creates an analysis issue with 3 drills
    Generates a program for the issue using the API
    Calls the /active/ endpoint with the analysis_issue id
    Tests that the returned program matches the generated program
    """
    _generate(client, auth_headers, analysis_issue_id)
    resp = client.get(
        f"/api/v1/programs/active/?analysis_issue_id={analysis_issue_id}",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["analysis_issue_id"] == str(analysis_issue_id)


def test_active_program_returns_null_when_none(client, auth_headers):
    """
    Calls the /active/ endpoint with a random analysis_issue id
    Tests that the returned program is null (no active program exists for the user)
    """
    resp = client.get(
        f"/api/v1/programs/active/?analysis_issue_id={uuid.uuid4()}",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json() is None


def test_next_step_first_is_range(client, premium, auth_headers, analysis_issue_id):
    """
    Creates an analysis issue with 3 drills
    Generates a program for the issue using the API
    Calls the /next-step/ endpoint for the program
    Tests that the returned step is a range step with 2 blocks (one for each drill)
    """
    
    program = _generate(client, auth_headers, analysis_issue_id).json()
    resp = client.get(f"/api/v1/programs/{program['id']}/next-step/", headers=auth_headers)
    assert resp.status_code == 200
    step = resp.json()
    assert step["session_type"] == "range"
    assert step["prescription"]["num_blocks"] == 2


def test_complete_step_returns_advance(client, premium, auth_headers, analysis_issue_id):
    """
    Creates an analysis issue with 3 drills
    Generates a program for the issue using the API
    Calls the /next-step/ endpoint for the program to get the first step
    Calls the /complete/ endpoint for the step with grades for each drill
    Tests that the completed step is returned with status "completed"
    Tests that the next step is returned and is different from the completed step
    Tests that the total_drills count is correct
    """
    
    program = _generate(client, auth_headers, analysis_issue_id).json()
    pid = program["id"]
    step = client.get(f"/api/v1/programs/{pid}/next-step/", headers=auth_headers).json()
    grades = [{"drill_id": d, "grade": "dialed"} for d in step["prescription"]["drill_ids"]]

    resp = client.post(
        f"/api/v1/programs/{pid}/steps/{step['id']}/complete/",
        json={"grades": grades},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["completed_step"]["id"] == step["id"]
    assert data["completed_step"]["status"] == "completed"
    assert data["next_step"] is not None
    assert data["total_drills"] == 3

    # The completed step advanced the program: the next next-step differs.
    follow = client.get(f"/api/v1/programs/{pid}/next-step/", headers=auth_headers).json()
    assert follow["id"] != step["id"]


def test_get_program_not_found(client, auth_headers):
    """
    Calls the /{program_id}/ endpoint with a random program id
    Tests that the returned status code is 404 (program not found)
    """
    
    resp = client.get(f"/api/v1/programs/{uuid.uuid4()}/", headers=auth_headers)
    assert resp.status_code == 404


def test_auth_required(client, analysis_issue_id):
    """
    Calls the /active/ endpoint with an invalid token
    Tests that the returned status code is 401 (unauthorized)
    """
    
    resp = client.get(
        f"/api/v1/programs/active/?analysis_issue_id={analysis_issue_id}",
        headers={"Authorization": "Bearer invalid-token"},
    )
    assert resp.status_code == 401
