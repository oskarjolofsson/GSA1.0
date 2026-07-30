"""GET /api/v1/taxonomy/ — the vocabularies clients render their tag pickers from."""

from core.services import taxonomy


def test_taxonomy_requires_authentication(client):
    """An invalid token is the 401 case; a missing header is a 422 from FastAPI,
    since get_current_user declares Authorization as a required Header(...)."""
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
    """The response must track core/services/taxonomy.py exactly."""
    data = client.get("/api/v1/taxonomy/", headers=auth_headers).json()

    assert data["areas"] == list(taxonomy.ALLOWED_AREAS)
    assert data["misses"] == list(taxonomy.ALLOWED_MISSES)
    assert data["goals"] == list(taxonomy.ALLOWED_GOALS)
    assert data["kinds"] == list(taxonomy.ALLOWED_KINDS)
    assert data["default_area"] == taxonomy.DEFAULT_AREA
    assert data["default_kind"] == taxonomy.DEFAULT_KIND


def test_taxonomy_defaults_are_members_of_their_vocabularies(client, auth_headers):
    """A default outside its own vocabulary would be rejected by the validators."""
    data = client.get("/api/v1/taxonomy/", headers=auth_headers).json()

    assert data["default_area"] in data["areas"]
    assert data["default_kind"] in data["kinds"]


def test_taxonomy_is_available_to_non_admins(client, auth_headers):
    """Not require_admin: the golfer-facing app needs these too. test_user is not an
    admin, so a 200 confirms the gating."""
    assert client.get("/api/v1/taxonomy/", headers=auth_headers).status_code == 200
