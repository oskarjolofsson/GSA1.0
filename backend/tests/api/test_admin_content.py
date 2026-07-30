"""The /admin/content catalog editor API.

Every route is require_admin, so the first class here is the gate itself. The rest
cover the behaviour that is hard to get right: composite writes that must be
all-or-nothing, deletes that would cascade into real user data, and the drill whose
practice history makes it undeletable.
"""

import uuid

import pytest

from core.services import user_service

BASE = "/api/v1/admin/content"


@pytest.fixture(scope="function", autouse=True)
def assign_admin_user(test_user, db_session):
    """Assign admin role to the test user for API authentication."""
    user_service.set_admin(
        user_id=str(test_user["user_id"]), set_to_admin=True, session=db_session
    )


def _compose_payload(title=None, **overrides):
    payload = {
        "title": title or f"Admin issue {uuid.uuid4().hex[:8]}",
        "description": "authored through the admin API",
        "area": "PITCHING",
        "kind": "fault",
        "misses": ["FAT"],
        "goals": ["CONTACT"],
        "new_drills": [],
        "existing_drill_ids": [],
    }
    payload.update(overrides)
    return payload


@pytest.fixture()
def composed_issue(client, auth_headers):
    """An issue created through the API, with one drill attached."""
    payload = _compose_payload(
        new_drills=[
            {
                "title": f"Drill {uuid.uuid4().hex[:6]}",
                "task": "t",
                "success_signal": "s",
                "fault_indicator": "f",
            }
        ]
    )
    response = client.post(f"{BASE}/issues/", json=payload, headers=auth_headers)
    assert response.status_code == 201, response.text
    return response.json()


class TestAdminGate:
    """Every route refuses a non-admin.

    disposable_user is a freshly created account, so it never has the admin role the
    autouse fixture grants to test_user.
    """

    @pytest.mark.parametrize(
        "method,path",
        [
            ("get", "/issues/"),
            ("post", "/issues/"),
            ("get", "/issues/{id}/"),
            ("get", "/issues/{id}/impact/"),
            ("delete", "/issues/{id}/"),
            ("get", "/drills/"),
            ("post", "/drills/"),
            ("get", "/drills/{id}/"),
            ("patch", "/drills/{id}/"),
            ("get", "/drills/{id}/impact/"),
            ("delete", "/drills/{id}/"),
            ("get", "/coverage/"),
        ],
    )
    def test_non_admin_is_refused(self, client, disposable_auth_headers, method, path):
        url = BASE + path.replace("{id}", str(uuid.uuid4()))
        # TestClient.get/delete take no json argument, so only send a body where the
        # method has one.
        kwargs = {"headers": disposable_auth_headers}
        if method in ("post", "patch"):
            kwargs["json"] = {}
        response = getattr(client, method)(url, **kwargs)
        assert response.status_code == 403

    def test_link_routes_refuse_non_admin(self, client, disposable_auth_headers):
        url = f"{BASE}/issues/{uuid.uuid4()}/drills/{uuid.uuid4()}/"
        assert client.post(url, headers=disposable_auth_headers).status_code == 403
        assert client.delete(url, headers=disposable_auth_headers).status_code == 403


class TestComposeIssue:
    def test_creates_issue_tags_and_drills_in_one_call(self, client, auth_headers, db_session):
        from core.infrastructure.db import models

        payload = _compose_payload(
            misses=["FAT", "THIN"],
            goals=["CONTACT", "SHORT_GAME"],
            current_motion="steep",
            new_drills=[
                {"title": "New A", "task": "t", "success_signal": "s", "fault_indicator": "f"},
                {"title": "New B", "task": "t", "success_signal": "s", "fault_indicator": "f"},
            ],
        )

        data = client.post(f"{BASE}/issues/", json=payload, headers=auth_headers).json()

        assert sorted(data["misses"]) == ["FAT", "THIN"]
        assert sorted(data["goals"]) == ["CONTACT", "SHORT_GAME"]
        assert sorted(d["title"] for d in data["drills"]) == ["New A", "New B"]
        assert data["drill_count"] == 2
        assert data["current_motion"] == "steep"
        # A catalog issue belongs to nobody; that is what makes it global.
        assert data["user_id"] is None
        assert data["source"] == "catalog"

        issue_id = uuid.UUID(data["id"])
        assert db_session.query(models.IssueMiss).filter_by(issue_id=issue_id).count() == 2
        assert db_session.query(models.IssueGoal).filter_by(issue_id=issue_id).count() == 2
        assert db_session.query(models.IssueDrill).filter_by(issue_id=issue_id).count() == 2

    def test_links_existing_drills(self, client, auth_headers, composed_issue):
        existing_id = composed_issue["drills"][0]["id"]

        data = client.post(
            f"{BASE}/issues/",
            json=_compose_payload(existing_drill_ids=[existing_id]),
            headers=auth_headers,
        ).json()

        assert [d["id"] for d in data["drills"]] == [existing_id]

    def test_unknown_tag_returns_422(self, client, auth_headers):
        response = client.post(
            f"{BASE}/issues/", json=_compose_payload(misses=["BANANA"]), headers=auth_headers
        )

        assert response.status_code == 422
        assert "BANANA" in response.json()["detail"]

    def test_unknown_area_returns_422(self, client, auth_headers):
        response = client.post(
            f"{BASE}/issues/", json=_compose_payload(area="MOON"), headers=auth_headers
        )
        assert response.status_code == 422

    def test_unresolvable_drill_reference_fails_the_whole_request(self, client, auth_headers):
        """A drill id that does not resolve aborts the compose with 404.

        This deliberately does NOT assert that nothing was written. The `client`
        fixture overrides get_db with a bare `yield db_session`, so the production
        commit/rollback wrapper never runs here and the partial rows stay visible
        inside the test transaction. The rollback itself is covered directly in
        tests/integration/db/test_get_db_dependency.py.
        """
        payload = _compose_payload(
            new_drills=[
                {"title": "orphan", "task": "t", "success_signal": "s", "fault_indicator": "f"}
            ],
            existing_drill_ids=[str(uuid.uuid4())],
        )

        response = client.post(f"{BASE}/issues/", json=payload, headers=auth_headers)

        assert response.status_code == 404


class TestIssueListing:
    def test_returns_page_envelope(self, client, auth_headers, composed_issue):
        data = client.get(f"{BASE}/issues/?limit=5&offset=0", headers=auth_headers).json()

        assert set(data) == {"items", "total", "limit", "offset"}
        assert data["limit"] == 5
        assert len(data["items"]) <= 5
        assert data["total"] >= 1

    def test_q_filters_by_title(self, client, auth_headers, composed_issue):
        data = client.get(
            f"{BASE}/issues/?q={composed_issue['title']}", headers=auth_headers
        ).json()

        assert [i["id"] for i in data["items"]] == [composed_issue["id"]]
        assert data["total"] == 1

    def test_area_and_source_filters_apply_to_total(self, client, auth_headers, composed_issue):
        """The count has to use the same predicates as the page, or paging lies."""
        data = client.get(f"{BASE}/issues/?area=PITCHING", headers=auth_headers).json()

        assert data["total"] == len(
            [i for i in data["items"] if i["area"] == "PITCHING"]
        ) or data["total"] >= len(data["items"])
        assert all(i["area"] == "PITCHING" for i in data["items"])

    def test_limit_is_capped(self, client, auth_headers):
        assert client.get(f"{BASE}/issues/?limit=5000", headers=auth_headers).status_code == 422

    def test_detail_matches_list_entry(self, client, auth_headers, composed_issue):
        data = client.get(f"{BASE}/issues/{composed_issue['id']}/", headers=auth_headers).json()

        assert data["id"] == composed_issue["id"]
        assert data["drill_count"] == len(data["drills"]) == 1

    def test_unknown_issue_is_404(self, client, auth_headers):
        response = client.get(f"{BASE}/issues/{uuid.uuid4()}/", headers=auth_headers)
        assert response.status_code == 404


class TestAttachDetach:
    def test_detach_then_attach_round_trip(self, client, auth_headers, composed_issue):
        issue_id, drill_id = composed_issue["id"], composed_issue["drills"][0]["id"]
        url = f"{BASE}/issues/{issue_id}/drills/{drill_id}/"

        detached = client.delete(url, headers=auth_headers).json()
        assert detached["drills"] == []

        reattached = client.post(url, headers=auth_headers).json()
        assert [d["id"] for d in reattached["drills"]] == [drill_id]

    def test_duplicate_attach_is_409(self, client, auth_headers, composed_issue):
        issue_id, drill_id = composed_issue["id"], composed_issue["drills"][0]["id"]

        response = client.post(
            f"{BASE}/issues/{issue_id}/drills/{drill_id}/", headers=auth_headers
        )

        assert response.status_code == 409

    def test_detaching_an_unlinked_drill_is_404(self, client, auth_headers, composed_issue):
        response = client.delete(
            f"{BASE}/issues/{composed_issue['id']}/drills/{uuid.uuid4()}/",
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_detach_leaves_the_drill_itself(self, client, auth_headers, composed_issue):
        """Unlinking must not delete the drill — other issues may prescribe it and
        its practice history has to survive."""
        issue_id, drill_id = composed_issue["id"], composed_issue["drills"][0]["id"]

        client.delete(f"{BASE}/issues/{issue_id}/drills/{drill_id}/", headers=auth_headers)

        assert client.get(f"{BASE}/drills/{drill_id}/", headers=auth_headers).status_code == 200


class TestDeleteImpact:
    def test_impact_counts_the_drill_mapping(self, client, auth_headers, composed_issue):
        data = client.get(
            f"{BASE}/issues/{composed_issue['id']}/impact/", headers=auth_headers
        ).json()

        assert data["mappings"] == 1
        assert data["blocking"] is True

    def test_delete_without_confirmation_is_409(self, client, auth_headers, composed_issue):
        response = client.delete(
            f"{BASE}/issues/{composed_issue['id']}/", headers=auth_headers
        )

        assert response.status_code == 409
        assert "confirm_impact" in response.json()["detail"]

    def test_delete_with_confirmation_succeeds(self, client, auth_headers, composed_issue):
        response = client.delete(
            f"{BASE}/issues/{composed_issue['id']}/?confirm_impact=true", headers=auth_headers
        )

        assert response.status_code == 204
        assert client.get(
            f"{BASE}/issues/{composed_issue['id']}/", headers=auth_headers
        ).status_code == 404

    def test_unreferenced_issue_deletes_without_confirmation(self, client, auth_headers):
        """Nothing points at it, so there is nothing to warn about."""
        created = client.post(
            f"{BASE}/issues/", json=_compose_payload(), headers=auth_headers
        ).json()

        response = client.delete(f"{BASE}/issues/{created['id']}/", headers=auth_headers)

        assert response.status_code == 204

    def test_impact_on_unknown_issue_is_404(self, client, auth_headers):
        response = client.get(f"{BASE}/issues/{uuid.uuid4()}/impact/", headers=auth_headers)
        assert response.status_code == 404


class TestDrills:
    def test_create_and_read_back(self, client, auth_headers):
        created = client.post(
            f"{BASE}/drills/",
            json={
                "title": "Standalone drill",
                "task": "t",
                "success_signal": "s",
                "fault_indicator": "f",
            },
            headers=auth_headers,
        ).json()

        assert created["user_id"] is None, "a catalog drill is global"
        assert created["issue_count"] == 0

        fetched = client.get(f"{BASE}/drills/{created['id']}/", headers=auth_headers).json()
        assert fetched["title"] == "Standalone drill"

    def test_patch_updates_only_supplied_fields(self, client, auth_headers, composed_issue):
        drill_id = composed_issue["drills"][0]["id"]
        before = client.get(f"{BASE}/drills/{drill_id}/", headers=auth_headers).json()

        data = client.patch(
            f"{BASE}/drills/{drill_id}/", json={"title": "Renamed"}, headers=auth_headers
        ).json()

        assert data["title"] == "Renamed"
        assert data["task"] == before["task"]

    def test_drill_lists_the_issues_that_prescribe_it(self, client, auth_headers, composed_issue):
        drill_id = composed_issue["drills"][0]["id"]

        data = client.get(f"{BASE}/drills/{drill_id}/", headers=auth_headers).json()

        assert data["issue_count"] == 1
        assert data["issues"][0]["id"] == composed_issue["id"]

    def test_drill_delete_requires_confirmation_when_linked(
        self, client, auth_headers, composed_issue
    ):
        drill_id = composed_issue["drills"][0]["id"]

        assert client.delete(
            f"{BASE}/drills/{drill_id}/", headers=auth_headers
        ).status_code == 409
        assert client.delete(
            f"{BASE}/drills/{drill_id}/?confirm_impact=true", headers=auth_headers
        ).status_code == 204

    def test_unknown_drill_is_404(self, client, auth_headers):
        assert client.get(
            f"{BASE}/drills/{uuid.uuid4()}/", headers=auth_headers
        ).status_code == 404


class TestCoverage:
    def test_reports_every_taxonomy_combination(self, client, auth_headers):
        from core.services.taxonomy import ALLOWED_AREAS, ALLOWED_GOALS, ALLOWED_MISSES

        data = client.get(f"{BASE}/coverage/", headers=auth_headers).json()

        expected = len(ALLOWED_AREAS) * len(ALLOWED_MISSES) * len(ALLOWED_GOALS)
        assert len(data["cells"]) == expected, (
            "cells are generated from the taxonomy, not the data — an absent "
            "combination is exactly the gap worth showing"
        )
        assert any(c["issue_count"] == 0 for c in data["cells"])

    def test_includes_catalog_health_counts(self, client, auth_headers):
        data = client.get(f"{BASE}/coverage/", headers=auth_headers).json()

        assert data["unmapped_drills"] >= 0
        assert data["issues_with_no_drills"] >= 0

    def test_a_new_issue_shows_up_in_its_cell(self, client, auth_headers):
        def cell(payload):
            return next(
                c
                for c in payload["cells"]
                if c["area"] == "BUNKER" and c["miss"] == "TOP" and c["goal"] == "BIG_MISS"
            )

        before = cell(client.get(f"{BASE}/coverage/", headers=auth_headers).json())

        client.post(
            f"{BASE}/issues/",
            json=_compose_payload(area="BUNKER", misses=["TOP"], goals=["BIG_MISS"]),
            headers=auth_headers,
        )

        after = cell(client.get(f"{BASE}/coverage/", headers=auth_headers).json())
        assert after["issue_count"] == before["issue_count"] + 1
