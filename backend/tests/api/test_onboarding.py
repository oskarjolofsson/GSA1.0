"""GET /api/v1/onboarding/catalog/ — the one unauthenticated read in the API.

It exists because the intro screen runs before the golfer has an account: they pick
an area and one focus point, and the app starts that focus for them the moment they
sign up. The alternative was hardcoding the areas and focus points in the app binary,
which is exactly the desync the taxonomy moved server-side to end.

Being unauthenticated is the whole risk surface, so these tests pin both halves: it
must answer without a token, and it must never leak anything user-scoped.
"""

from core.infrastructure.db.models.Drill import Drill
from core.infrastructure.db.models.Issue import Issue
from core.infrastructure.db.models.IssueDrill import IssueDrill


def _seed_global_issue(db_session, title: str = "Global sway") -> Issue:
    """A global catalog issue (user_id NULL) with one linked drill."""
    issue = Issue(title=title, description="d")
    db_session.add(issue)
    db_session.flush()
    drill = Drill(title="Wall", task="t", success_signal="s", fault_indicator="f")
    db_session.add(drill)
    db_session.flush()
    db_session.add(IssueDrill(issue_id=issue.id, drill_id=drill.id))
    db_session.flush()
    return issue


def test_catalog_answers_without_a_token(client, db_session):
    """The point of the endpoint. Every other route declares Authorization as a
    required header, so a tokenless call there is a 422 before it is a 401."""
    _seed_global_issue(db_session)

    response = client.get("/api/v1/onboarding/catalog/")

    assert response.status_code == 200
    assert set(response.json()) == {"areas", "issues"}


def test_catalog_carries_areas_with_golfer_labels(client, db_session):
    """The intro renders the same five parts of the game the library does, from the
    same rows — labels included, so none of that vocabulary lives in the app."""
    data = client.get("/api/v1/onboarding/catalog/").json()

    assert data["areas"]
    for area in data["areas"]:
        assert area["key"] and area["label"] and area["golfer_label"]


def test_catalog_issues_carry_their_drills(client, db_session):
    """A focus point is only startable with drills attached, and the intro row shows
    the count — so the drills have to come down with the issue, not in a second call."""
    _seed_global_issue(db_session, title="Onboarding sway")

    data = client.get("/api/v1/onboarding/catalog/").json()

    seeded = next(i for i in data["issues"] if i["title"] == "Onboarding sway")
    assert seeded["area"] == "FULL_SWING"
    assert [d["title"] for d in seeded["drills"]] == ["Wall"]


def test_catalog_never_exposes_a_users_custom_issue(client, db_session, test_user):
    """The security boundary. `/issues/catalog/` merges the global catalog with the
    caller's own custom issues; this endpoint has no caller, so it must serve the
    global rows alone. A regression here would publish private coach notes to anyone
    who can reach the URL."""
    custom = Issue(
        title="Someone's private coach note",
        description="d",
        user_id=test_user["user_id"],
        source="custom",
    )
    db_session.add(custom)
    db_session.flush()

    data = client.get("/api/v1/onboarding/catalog/").json()

    titles = {i["title"] for i in data["issues"]}
    assert "Someone's private coach note" not in titles
