"""
Program engine HTTP contract tests.

Seeding goes straight through `db_session` (the same connection the TestClient's
get_db override yields), so rows are visible to the API call and rolled back
after each test. user_id uses the real `test_user` (FK to auth.users). The
`/generate/` route is gated by `require_focus_capacity` (focus-capacity check, not
the AI-access gate), so we override that dependency to bypass it in these tests.
"""
import uuid
import pytest

from app.main import app
from app.dependencies.entitlement import require_focus_capacity

from core.infrastructure.db.models.Issue import Issue
from core.infrastructure.db.models.Drill import Drill
from core.infrastructure.db.models.IssueDrill import IssueDrill
from core.infrastructure.db.models.Analysis import Analysis
from core.infrastructure.db.models.AnalysisIssue import AnalysisIssue


@pytest.fixture
def premium(test_user):
    """Name kept as `premium` for minimal churn across this file's tests; it
    overrides `require_focus_capacity` (the router-level dependency gating
    /generate/). Tests that create more than one active focus also need
    `subscribed_for_service_layer` below -- this fixture alone does not satisfy
    the authoritative, row-locked check inside `program_service.generate_program`
    (see ADR-0004 / CEO review Section 3), which calls entitlement_service
    directly and ignores FastAPI dependency overrides."""
    app.dependency_overrides[require_focus_capacity] = lambda: {"user_id": str(test_user["user_id"])}
    yield
    app.dependency_overrides.pop(require_focus_capacity, None)


@pytest.fixture
def subscribed_for_service_layer(monkeypatch):
    """Patches entitlement_service.is_subscribed so program_service's authoritative
    free-tier cap doesn't block a test that intentionally creates 2+ active focuses
    to exercise area-cap/slot mechanics unrelated to the free-tier cap itself. Only
    use this alongside `premium` in tests that create multiple focuses -- tests
    exercising the actual unsubscribed lazy-check/deactivation behavior must NOT
    use this, since it makes is_subscribed() unconditionally True."""
    from core.services import program_service as ps

    monkeypatch.setattr(ps.entitlement_service, "is_subscribed", lambda user_id, session: True)


@pytest.fixture
def analysis_issue_id(db_session, test_user):
    """Seed an owned analysis issue with 3 linked drills; return its id."""
    issue = Issue(title="Early extension", description="d")
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


def _seed_analysis_issue(db_session, test_user, title, area="FULL_SWING", num_drills=2):
    """A second seeded issue, so multi-program cases have something to open."""
    issue = Issue(title=title, description="d", area=area)
    db_session.add(issue)
    db_session.flush()
    for i in range(num_drills):
        drill = Drill(title=f"{title} drill {i}", task="t", success_signal="s", fault_indicator="f")
        db_session.add(drill)
        db_session.flush()
        db_session.add(IssueDrill(issue_id=issue.id, drill_id=drill.id))
    analysis = Analysis(user_id=test_user["user_id"], model_version="v1.0")
    db_session.add(analysis)
    db_session.flush()
    ai = AnalysisIssue(analysis_id=analysis.id, issue_id=issue.id, confidence=0.8)
    db_session.add(ai)
    db_session.flush()
    return ai.id


# ---------------- GET /programs/ (everything the golfer has open) ----------------

def test_list_programs_is_empty_for_a_new_golfer(client, auth_headers):
    """An empty slate is a normal state, not an error -- a first-run golfer hits this."""
    resp = client.get("/api/v1/programs/", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json() == []


def test_list_programs_returns_every_open_program_with_its_next_step(
    client, premium, subscribed_for_service_layer, auth_headers, db_session, test_user, analysis_issue_id
):
    """One request has to render the whole slate. Before this endpoint existed a client
    had to fetch each program's next step separately, which is a round trip per program
    on every Home render."""
    putting = _seed_analysis_issue(db_session, test_user, "Lag putting", area="PUTTING")
    _generate(client, auth_headers, analysis_issue_id)
    _generate(client, auth_headers, putting)

    resp = client.get("/api/v1/programs/", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2

    by_area = {p["area"]: p for p in data}
    assert set(by_area) == {"FULL_SWING", "PUTTING"}
    for program in data:
        assert program["status"] == "active"
        assert program["slot"] == 0  # one per area here, so each takes the first slot
        assert program["next_step"] is not None
        assert program["next_step"]["session_type"] == "range"
        assert program["next_step"]["status"] == "pending"


def test_list_programs_never_schedules_a_play_step(
    client, premium, auth_headers, analysis_issue_id
):
    """Playing a round is one activity serving every open program at once, so it is not a
    step inside any of them. Several programs must never mean several 'go play' prompts."""
    _generate(client, auth_headers, analysis_issue_id)
    data = client.get("/api/v1/programs/", headers=auth_headers).json()
    assert all(p["next_step"]["session_type"] != "play" for p in data)


def test_list_programs_is_scoped_to_the_caller(
    client, premium, auth_headers, analysis_issue_id, disposable_auth_headers
):
    """The route takes no ids from the client, so the only thing that can leak is the
    scoping itself."""
    _generate(client, auth_headers, analysis_issue_id)
    resp = client.get("/api/v1/programs/", headers=disposable_auth_headers)
    assert resp.status_code == 200
    assert resp.json() == []


def test_third_program_in_an_area_is_a_clean_409(
    client, premium, subscribed_for_service_layer, auth_headers, db_session, test_user, analysis_issue_id
):
    """Hitting the cap is an expected outcome, so it has to arrive as a 409 the client can
    show, not a 500 from an IntegrityError leaking out of the unique index. The message
    must name the area -- a golfer with work across four areas cannot act on
    "you already have two focuses"."""
    second = _seed_analysis_issue(db_session, test_user, "Second swing fault")
    third = _seed_analysis_issue(db_session, test_user, "Third swing fault")

    assert _generate(client, auth_headers, analysis_issue_id).status_code == 201
    assert _generate(client, auth_headers, second).status_code == 201

    resp = _generate(client, auth_headers, third)
    assert resp.status_code == 409
    assert "full swing" in resp.json()["detail"].lower()


def test_cap_does_not_block_a_different_area(
    client, premium, subscribed_for_service_layer, auth_headers, db_session, test_user, analysis_issue_id
):
    """A full slate of full-swing work must leave putting open -- the entire reason the
    cap is per-area."""
    second = _seed_analysis_issue(db_session, test_user, "Second swing fault")
    putting = _seed_analysis_issue(db_session, test_user, "Lag putting", area="PUTTING")

    _generate(client, auth_headers, analysis_issue_id)
    _generate(client, auth_headers, second)

    resp = _generate(client, auth_headers, putting)
    assert resp.status_code == 201
    assert resp.json()["area"] == "PUTTING"


def test_list_programs_does_not_write(
    client, premium, auth_headers, db_session, analysis_issue_id
):
    """Reading Home must not mutate anything. get_next_step used to schedule a step when
    it found none, so embedding next_step here would have inserted a row per program on
    every pull-to-refresh."""
    from core.infrastructure.db.models.ProgramStep import ProgramStep

    _generate(client, auth_headers, analysis_issue_id)
    before = db_session.query(ProgramStep).count()
    for _ in range(3):
        assert client.get("/api/v1/programs/", headers=auth_headers).status_code == 200
    assert db_session.query(ProgramStep).count() == before


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
    assert data["area"] == "FULL_SWING"
    assert data["slot"] == 0

    # Seeding schedules the first session up front. It used to arrive empty and get a
    # step created lazily by the first next-step read, which made a GET write rows --
    # untenable once the list endpoint reads every program on each Home render.
    assert len(data["steps"]) == 1
    assert data["steps"][0]["status"] == "pending"
    assert data["steps"][0]["session_type"] == "range"


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
    # Drill ids are resolved to {id, title} for display.
    assert len(step["drills"]) == 2
    assert all(d["title"] for d in step["drills"])
    assert {d["id"] for d in step["drills"]} == set(step["prescription"]["drill_ids"])


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


# ---------------- require_focus_capacity (T1/T13) ----------------
#
# These tests exercise the real dependency (no `premium` override) against `test_user`,
# who has no billing_subscription row and so is unsubscribed by default.

def test_unsubscribed_user_with_zero_active_focuses_can_generate(
    client, auth_headers, analysis_issue_id
):
    """0 active focuses -> require_focus_capacity allows an unsubscribed user through."""
    resp = _generate(client, auth_headers, analysis_issue_id)
    assert resp.status_code == 201


def test_unsubscribed_user_with_one_active_focus_is_blocked(
    client, auth_headers, db_session, test_user, analysis_issue_id
):
    """1 active focus + unsubscribed -> 402, before the request even reaches the service
    layer's row-locked check."""
    second = _seed_analysis_issue(db_session, test_user, "Second swing fault")

    assert _generate(client, auth_headers, analysis_issue_id).status_code == 201

    resp = _generate(client, auth_headers, second)
    assert resp.status_code == 402


def test_subscribed_user_always_has_focus_capacity(
    client, auth_headers, db_session, test_user, analysis_issue_id
):
    """A subscribed user is never blocked by the focus-capacity dependency, even with an
    active focus already open (the per-area slot cap is a separate, later check)."""
    from core.infrastructure.db.repositories import billing_customer as billing_customer_repo
    from core.infrastructure.db.repositories import billing_subscription as billing_subscription_repo

    billing_customer = billing_customer_repo.create_billing_customer(
        user_id=test_user["user_id"],
        customer_id="cus_focus_capacity",
        provider="revenuecat",
        session=db_session,
    )
    billing_subscription_repo.upsert_subscription(
        billing_customer_id=billing_customer.id,
        provider="revenuecat",
        external_subscription_id="sub_focus_capacity",
        external_price_id="price_focus_capacity",
        status="active",
        current_period_start=None,
        current_period_end=None,
        cancel_at_period_end=False,
        canceled_at=None,
        ended_at=None,
        session=db_session,
    )
    db_session.flush()

    second = _seed_analysis_issue(db_session, test_user, "Second swing fault")
    putting = _seed_analysis_issue(db_session, test_user, "Lag putting", area="PUTTING")

    assert _generate(client, auth_headers, analysis_issue_id).status_code == 201
    # Second focus, same area, still under the per-area cap of two -> allowed.
    assert _generate(client, auth_headers, second).status_code == 201
    # Different area entirely -> also allowed.
    assert _generate(client, auth_headers, putting).status_code == 201


# ---------------- lazy check on GET /programs/active/ (T5) ----------------

def test_active_program_lazy_check_fires_for_unsubscribed_user(
    client, premium, auth_headers, analysis_issue_id, monkeypatch
):
    """An unsubscribed caller hitting /active/ triggers the cheap lazy-check hook."""
    import app.api.v1.endpoints.program as program_endpoint

    calls = []
    monkeypatch.setattr(
        program_endpoint,
        "deactivate_extra_focuses",
        lambda user_id, db, trigger: calls.append(trigger),
    )

    _generate(client, auth_headers, analysis_issue_id)
    resp = client.get(
        f"/api/v1/programs/active/?analysis_issue_id={analysis_issue_id}",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert calls == ["lazy_check"]


def test_active_program_lazy_check_skipped_for_subscribed_user(
    client, premium, auth_headers, db_session, test_user, analysis_issue_id, monkeypatch
):
    """A subscribed caller never pays for the lazy-check hook at all."""
    from core.infrastructure.db.repositories import billing_customer as billing_customer_repo
    from core.infrastructure.db.repositories import billing_subscription as billing_subscription_repo
    import app.api.v1.endpoints.program as program_endpoint

    billing_customer = billing_customer_repo.create_billing_customer(
        user_id=test_user["user_id"],
        customer_id="cus_lazy_check_skip",
        provider="revenuecat",
        session=db_session,
    )
    billing_subscription_repo.upsert_subscription(
        billing_customer_id=billing_customer.id,
        provider="revenuecat",
        external_subscription_id="sub_lazy_check_skip",
        external_price_id="price_lazy_check_skip",
        status="active",
        current_period_start=None,
        current_period_end=None,
        cancel_at_period_end=False,
        canceled_at=None,
        ended_at=None,
        session=db_session,
    )
    db_session.flush()

    calls = []
    monkeypatch.setattr(
        program_endpoint,
        "deactivate_extra_focuses",
        lambda user_id, db, trigger: calls.append(trigger),
    )

    _generate(client, auth_headers, analysis_issue_id)
    resp = client.get(
        f"/api/v1/programs/active/?analysis_issue_id={analysis_issue_id}",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert calls == []
