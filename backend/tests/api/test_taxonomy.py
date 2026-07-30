"""GET /api/v1/taxonomy/

The point of this endpoint is that clients stop hardcoding tag vocabularies. The
drift test below is the one that earns its keep: if someone adds a value to
core/services/taxonomy.py (and the matching SQL CHECK) but the endpoint stops
reporting it, every client silently loses the ability to use it.
"""

from core.services import taxonomy


def test_taxonomy_requires_authentication(client):
    """Matches the convention in test_issue.py: an INVALID token is the 401 case. A
    missing Authorization header is a 422 instead, because get_current_user declares
    it as a required Header(...), so FastAPI rejects it during validation."""
    response = client.get(
        "/api/v1/taxonomy/", headers={"Authorization": "Bearer invalid-token"}
    )
    assert response.status_code == 401


def test_taxonomy_returns_all_four_vocabularies(client, auth_headers):
    response = client.get("/api/v1/taxonomy/", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert set(data) == {
        "areas",
        "misses",
        "goals",
        "kinds",
        "default_area",
        "default_kind",
    }


def test_taxonomy_matches_the_canonical_module_exactly(client, auth_headers):
    """Drift guard. This is the whole reason the endpoint exists."""
    data = client.get("/api/v1/taxonomy/", headers=auth_headers).json()

    assert data["areas"] == list(taxonomy.ALLOWED_AREAS)
    assert data["misses"] == list(taxonomy.ALLOWED_MISSES)
    assert data["goals"] == list(taxonomy.ALLOWED_GOALS)
    assert data["kinds"] == list(taxonomy.ALLOWED_KINDS)
    assert data["default_area"] == taxonomy.DEFAULT_AREA
    assert data["default_kind"] == taxonomy.DEFAULT_KIND


def test_taxonomy_defaults_are_members_of_their_vocabularies(client, auth_headers):
    """A default outside its own vocabulary would let the admin create an issue the
    strict validators immediately reject."""
    data = client.get("/api/v1/taxonomy/", headers=auth_headers).json()

    assert data["default_area"] in data["areas"]
    assert data["default_kind"] in data["kinds"]


def test_taxonomy_is_available_to_non_admins(client, auth_headers):
    """Deliberately not require_admin: the golfer-facing app needs these values too.
    The default test_user is not an admin, so a 200 here proves the gating."""
    assert client.get("/api/v1/taxonomy/", headers=auth_headers).status_code == 200
