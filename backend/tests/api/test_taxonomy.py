"""GET /api/v1/taxonomy/ — the vocabularies clients render their tag pickers from.

Rewritten when the taxonomy moved into the database. The response used to be four flat
lists of strings; it now carries display labels too, because holding those client-side is
what produced four hand-synced copies of the same vocabulary. Serving them here is what
lets `constants.ts` and `constants/Misses.ts` be deleted.

Misses arrive twice on purpose — flat in `misses`, grouped in `misses_by_area`. The grouped
view is what the library navigates.
"""

from core.services import taxonomy


def test_taxonomy_requires_authentication(client):
    """An invalid token is the 401 case; a missing header is a 422 from FastAPI,
    since get_current_user declares Authorization as a required Header(...)."""
    response = client.get(
        "/api/v1/taxonomy/", headers={"Authorization": "Bearer invalid-token"}
    )
    assert response.status_code == 401


def test_taxonomy_returns_every_vocabulary(client, auth_headers):
    response = client.get("/api/v1/taxonomy/", headers=auth_headers)

    assert response.status_code == 200
    assert set(response.json()) == {
        "areas",
        "goals",
        "misses",
        "misses_by_area",
        "kinds",
        "default_area",
        "default_kind",
    }


def test_terms_carry_the_labels_each_audience_sees(client, auth_headers):
    """The whole reason the taxonomy moved server-side.

    `label` is coach vocabulary for the admin, `golfer_label` is what a 12-handicap taps,
    `blurb` is the optional subtitle underneath it. A client rendering a picker needs all
    three and should hold none of them.
    """
    data = client.get("/api/v1/taxonomy/", headers=auth_headers).json()

    slice_miss = next(m for m in data["misses"] if m["key"] == "SLICE")
    assert slice_miss["label"] == "Slice"
    assert slice_miss["golfer_label"] == "I slice it"
    assert slice_miss["blurb"] == "Curves hard right"
    assert slice_miss["area"] == "FULL_SWING"

    for term in data["areas"] + data["goals"]:
        assert term["key"] and term["label"] and term["golfer_label"]


def test_blurb_is_optional(client, auth_headers):
    """Nullable by design: a term whose title says everything stays one line in the UI."""
    data = client.get("/api/v1/taxonomy/", headers=auth_headers).json()
    for term in data["areas"] + data["goals"] + data["misses"]:
        assert "blurb" in term  # present as a key, may be null


def test_misses_are_grouped_by_area(client, auth_headers):
    """A miss belongs to exactly one area, and every area gets a key.

    Empty areas must still appear: a client rendering an area grid needs to know an area
    exists with nothing in it yet ("Coming soon") rather than have it silently absent.
    """
    data = client.get("/api/v1/taxonomy/", headers=auth_headers).json()

    area_keys = {a["key"] for a in data["areas"]}
    assert set(data["misses_by_area"]) == area_keys

    assert "SLICE" in [m["key"] for m in data["misses_by_area"]["FULL_SWING"]]
    assert data["misses_by_area"]["PUTTING"] == []

    # The grouped view is a partition of the flat one: same rows, no duplicates, none lost.
    grouped = [m["key"] for ms in data["misses_by_area"].values() for m in ms]
    assert sorted(grouped) == sorted(m["key"] for m in data["misses"])


def test_taxonomy_matches_what_the_validators_enforce(client, auth_headers):
    """The response and the server-side validators must agree.

    They read the same tables but by different paths — this endpoint reads rows for their
    labels, the validators read keys through a process cache — so drift between them is
    possible and would show up as a client offering a tag the API then rejects.
    """
    data = client.get("/api/v1/taxonomy/", headers=auth_headers).json()

    assert [a["key"] for a in data["areas"]] == list(taxonomy.allowed_areas())
    assert [g["key"] for g in data["goals"]] == list(taxonomy.allowed_goals())
    assert [m["key"] for m in data["misses"]] == list(taxonomy.allowed_misses())
    assert data["kinds"] == list(taxonomy.ALLOWED_KINDS)
    assert data["default_area"] == taxonomy.DEFAULT_AREA
    assert data["default_kind"] == taxonomy.DEFAULT_KIND

    for area, misses in data["misses_by_area"].items():
        assert [m["key"] for m in misses] == list(taxonomy.misses_for(area))


def test_taxonomy_defaults_are_members_of_their_vocabularies(client, auth_headers):
    """A default outside its own vocabulary would be rejected by the validators."""
    data = client.get("/api/v1/taxonomy/", headers=auth_headers).json()

    assert data["default_area"] in [a["key"] for a in data["areas"]]
    assert data["default_kind"] in data["kinds"]


def test_taxonomy_is_available_to_non_admins(client, auth_headers):
    """Not require_admin: the golfer-facing app needs these too. test_user is not an
    admin, so a 200 confirms the gating."""
    assert client.get("/api/v1/taxonomy/", headers=auth_headers).status_code == 200
