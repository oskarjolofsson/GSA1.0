"""Admin CRUD for the practice vocabulary.

This is the surface the whole taxonomy refactor exists for. Adding a miss used to be a
migration plus three hand-synced file edits, which is why four areas of the game went
unauthored. Slice C needs roughly forty misses written, most wrong on the first attempt.

The behaviours worth pinning are the ones that protect authored content:

  delete is RESTRICTed   a term issues still carry cannot be removed, and the refusal
                         counts them rather than surfacing an IntegrityError
  retire instead         active = false takes a value out of circulation while existing
                         tags survive
  keys are immutable     they are the foreign key; renaming would orphan every tag
  writes bust the cache  the validators read a process-level cache, so a write that does
                         not reset it is invisible until restart
"""

import uuid

import pytest

from core.services import taxonomy, user_service

BASE = "/api/v1/admin/content/taxonomy"


@pytest.fixture(scope="function", autouse=True)
def assign_admin_user(test_user, db_session):
    """Every route here is require_admin. Same shape as test_admin_content.py."""
    user_service.set_admin(
        user_id=str(test_user["user_id"]), set_to_admin=True, session=db_session
    )


def _key(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:6]}".upper()


class TestAuth:
    def test_requires_admin(self, client, disposable_auth_headers):
        """test_user is not an admin; these must be closed to them."""
        assert client.get(f"{BASE}/misses/", headers=disposable_auth_headers).status_code == 403
        assert client.post(
            f"{BASE}/misses/", json={}, headers=disposable_auth_headers
        ).status_code == 403


class TestCreate:
    def test_creates_a_miss_inside_an_area(self, client, auth_headers):
        key = _key("CHUNK")
        response = client.post(
            f"{BASE}/misses/",
            json={
                "key": key,
                "area": "CHIPPING",
                "label": "Chunk",
                "golfer_label": "I chunk it",
                "blurb": "Club hits the ground before the ball",
            },
            headers=auth_headers,
        )

        assert response.status_code == 201
        data = response.json()
        assert data["key"] == key
        assert data["area"] == "CHIPPING"
        assert data["blurb"] == "Club hits the ground before the ball"
        assert data["active"] is True
        assert data["usage_count"] == 0

    def test_normalizes_the_key(self, client, auth_headers):
        """Otherwise `slice`, `Slice` and `SLICE` become three rows."""
        raw = _key("leaves short").lower().replace("_", " ")
        data = client.post(
            f"{BASE}/misses/",
            json={
                "key": raw, "area": "PUTTING",
                "label": "Leaves short", "golfer_label": "I leave them short",
            },
            headers=auth_headers,
        ).json()

        assert data["key"] == raw.strip().upper().replace(" ", "_")

    def test_duplicate_key_is_409(self, client, auth_headers):
        key = _key("DUPE")
        body = {
            "key": key, "area": "BUNKER",
            "label": "Dupe", "golfer_label": "Dupe",
        }
        assert client.post(f"{BASE}/misses/", json=body, headers=auth_headers).status_code == 201
        assert client.post(f"{BASE}/misses/", json=body, headers=auth_headers).status_code == 409

    def test_miss_in_an_unknown_area_is_refused(self, client, auth_headers):
        """Checked here rather than left to the foreign key, so the message is readable."""
        response = client.post(
            f"{BASE}/misses/",
            json={
                "key": _key("NOWHERE"), "area": "MOON",
                "label": "Nowhere", "golfer_label": "Nowhere",
            },
            headers=auth_headers,
        )
        assert response.status_code == 422
        assert "MOON" in response.json()["detail"]

    def test_new_term_is_immediately_usable(self, client, auth_headers, db_session):
        """The cache must be busted on write, or the CMS silently does nothing.

        A value the editor shows but the validators reject is the exact failure mode the
        process-level cache introduces, so both halves are pinned:

          1. the write clears the cache
          2. a reload finds the new row

        Step 2 needs `prime_from`, because the request wrote through the test's
        rolling-back transaction and a fresh session would see nothing. In production the
        request has committed by then and `reset_cache` alone is enough.
        """
        taxonomy.misses_for("CHIPPING")          # warm it, so we are testing the bust
        assert taxonomy._CACHE is not None

        key = _key("BLADE")
        client.post(
            f"{BASE}/misses/",
            json={
                "key": key, "area": "CHIPPING",
                "label": "Blade", "golfer_label": "I blade it",
            },
            headers=auth_headers,
        )

        assert taxonomy._CACHE is None, "the write must invalidate the cached vocabulary"

        taxonomy.prime_from(db_session)
        assert key in taxonomy.misses_for("CHIPPING")
        assert taxonomy.area_of_miss(key) == "CHIPPING"


class TestUpdate:
    def test_edits_labels_without_touching_the_key(self, client, auth_headers):
        key = _key("EDITME")
        client.post(
            f"{BASE}/misses/",
            json={"key": key, "area": "PITCHING", "label": "Old", "golfer_label": "Old"},
            headers=auth_headers,
        )

        data = client.patch(
            f"{BASE}/misses/{key}/",
            json={"label": "New", "blurb": "Now with a subtitle"},
            headers=auth_headers,
        ).json()

        assert data["key"] == key
        assert data["label"] == "New"
        assert data["blurb"] == "Now with a subtitle"
        assert data["golfer_label"] == "Old", "omitted fields are left alone"

    def test_retiring_removes_it_from_validation_but_keeps_the_row(
        self, client, auth_headers, db_session
    ):
        """`active = false` is the answer for a term that cannot be deleted.

        prime_from after each write for the same reason as above: these requests write
        inside the test's uncommitted transaction, which a fresh reload cannot see.
        """
        key = _key("RETIRE")
        client.post(
            f"{BASE}/misses/",
            json={"key": key, "area": "BUNKER", "label": "R", "golfer_label": "R"},
            headers=auth_headers,
        )
        taxonomy.prime_from(db_session)
        assert key in taxonomy.misses_for("BUNKER")

        client.patch(f"{BASE}/misses/{key}/", json={"active": False}, headers=auth_headers)
        taxonomy.prime_from(db_session)

        assert key not in taxonomy.misses_for("BUNKER")
        # Still listed in the editor, or it could never be brought back.
        listed = client.get(f"{BASE}/misses/", headers=auth_headers).json()
        assert any(t["key"] == key and t["active"] is False for t in listed)

    def test_unknown_key_is_404(self, client, auth_headers):
        assert client.patch(
            f"{BASE}/misses/NOPE/", json={"label": "x"}, headers=auth_headers
        ).status_code == 404


class TestDelete:
    def test_deletes_an_unused_term(self, client, auth_headers):
        key = _key("UNUSED")
        client.post(
            f"{BASE}/goals/",
            json={"key": key, "label": "Unused", "golfer_label": "Unused"},
            headers=auth_headers,
        )

        assert client.delete(f"{BASE}/goals/{key}/", headers=auth_headers).status_code == 204
        assert client.get(f"{BASE}/goals/", headers=auth_headers).json() is not None
        assert key not in taxonomy.allowed_goals()

    def test_refuses_when_issues_still_use_it(self, client, auth_headers, db_session):
        """Counted refusal, not a raw IntegrityError from ON DELETE RESTRICT.

        Cascading would silently strip tags off authored content, which is worse than
        refusing — so the message says how many and points at retiring instead.
        """
        from core.infrastructure.db import models

        key = _key("INUSE")
        client.post(
            f"{BASE}/goals/",
            json={"key": key, "label": "In use", "golfer_label": "In use"},
            headers=auth_headers,
        )

        issue = models.Issue(title="Tagged", description="d")
        issue.goals.append(models.IssueGoal(goal=key))
        db_session.add(issue)
        db_session.flush()

        response = client.delete(f"{BASE}/goals/{key}/", headers=auth_headers)
        assert response.status_code == 409
        detail = response.json()["detail"]
        assert "1 issue" in detail
        assert "active = false" in detail

    def test_refuses_to_delete_an_area_that_still_has_misses(self, client, auth_headers):
        """The area FK on taxonomy_misses is RESTRICT too."""
        area = _key("TEMPAREA")
        client.post(
            f"{BASE}/areas/",
            json={"key": area, "label": "Temp", "golfer_label": "Temp"},
            headers=auth_headers,
        )
        client.post(
            f"{BASE}/misses/",
            json={"key": _key("TEMPMISS"), "area": area, "label": "M", "golfer_label": "M"},
            headers=auth_headers,
        )

        response = client.delete(f"{BASE}/areas/{area}/", headers=auth_headers)
        assert response.status_code == 409
        assert "miss" in response.json()["detail"]


class TestListing:
    def test_reports_usage_so_the_editor_can_disable_delete(self, client, auth_headers, db_session):
        from core.infrastructure.db import models

        key = _key("COUNTED")
        client.post(
            f"{BASE}/goals/",
            json={"key": key, "label": "Counted", "golfer_label": "Counted"},
            headers=auth_headers,
        )

        for _ in range(2):
            issue = models.Issue(title="Tagged", description="d")
            issue.goals.append(models.IssueGoal(goal=key))
            db_session.add(issue)
        db_session.flush()

        listed = client.get(f"{BASE}/goals/", headers=auth_headers).json()
        row = next(t for t in listed if t["key"] == key)
        assert row["usage_count"] == 2

    def test_misses_carry_their_area(self, client, auth_headers):
        listed = client.get(f"{BASE}/misses/", headers=auth_headers).json()
        assert all(t["area"] for t in listed)

    def test_unknown_kind_is_422_naming_the_options(self, client, auth_headers):
        response = client.get(f"{BASE}/bananas/", headers=auth_headers)
        assert response.status_code == 422
        assert "area" in response.json()["detail"]
