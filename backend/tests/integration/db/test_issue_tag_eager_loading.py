"""Query-count guards for goal/miss tag eager loading.

Issue.goals and Issue.misses are lazy by default, and every issue read feeds a
response DTO that includes them — so without `_TAG_OPTS` in repositories/issues.py
each issue costs two extra queries.

A query added without `.options(*_TAG_OPTS)` reads fine and only shows up as a slow
screen in production, so these tests assert on query count, which is deterministic.
"""

import uuid

import pytest
from sqlalchemy import event

from ....core.infrastructure.db import models
from ....core.infrastructure.db.repositories.issues import (
    create_issue,
    get_all_issues,
    get_catalog_and_user_issues,
    get_issue_by_id,
    get_issues_by_ids,
)


class QueryCounter:
    """Count SQL statements emitted on a session's connection.

    Usage:
        with QueryCounter(db_session) as counter:
            ...do work...
        assert counter.count == 3
    """

    def __init__(self, session):
        self._session = session
        self.statements: list[str] = []

    @property
    def count(self) -> int:
        return len(self.statements)

    def _before_cursor_execute(self, conn, cursor, statement, params, context, many):
        self.statements.append(statement)

    def __enter__(self):
        event.listen(
            self._session.get_bind(), "before_cursor_execute", self._before_cursor_execute
        )
        return self

    def __exit__(self, *exc):
        event.remove(
            self._session.get_bind(), "before_cursor_execute", self._before_cursor_execute
        )
        return False

    def explain(self) -> str:
        """Readable dump for a failure message."""
        return "\n".join(f"  {i + 1}. {s.splitlines()[0]}" for i, s in enumerate(self.statements))


def _make_tagged_issue(session, title: str) -> models.Issue:
    """An issue with two goals and two misses, so a lazy load is visible."""
    issue = models.Issue(title=title, description="tag eager-loading fixture")
    issue.goals.append(models.IssueGoal(goal="STRAIGHTER"))
    issue.goals.append(models.IssueGoal(goal="BIG_MISS"))
    issue.misses.append(models.IssueMiss(miss="SLICE"))
    issue.misses.append(models.IssueMiss(miss="PULL"))
    return create_issue(issue, session)


@pytest.fixture()
def tagged_issues(db_session):
    """Five tagged issues: enough that eager (3 queries) and lazy (11) differ clearly."""
    suffix = uuid.uuid4().hex[:8]
    issues = [_make_tagged_issue(db_session, f"Eager fixture {suffix} {i}") for i in range(5)]
    db_session.flush()
    # Detach everything so the following reads genuinely hit the database instead of
    # being served from the identity map with collections already populated.
    db_session.expunge_all()
    return issues


class TestTagEagerLoading:
    def test_get_issues_by_ids_is_flat_in_query_count(self, db_session, tagged_issues):
        ids = [i.id for i in tagged_issues]

        with QueryCounter(db_session) as counter:
            issues = get_issues_by_ids(ids, db_session)
            # Touch the collections — this is where a lazy load would fire.
            tags = [(len(i.goals), len(i.misses)) for i in issues]

        assert len(issues) == 5
        assert all(t == (2, 2) for t in tags)
        assert counter.count == 3, (
            "Expected 3 queries (issues + goals + misses). Got "
            f"{counter.count}, which means the tag collections lazy-loaded per issue:\n"
            f"{counter.explain()}"
        )

    def test_get_all_issues_is_flat_in_query_count(self, db_session, tagged_issues):
        with QueryCounter(db_session) as counter:
            issues = get_all_issues(db_session)
            for issue in issues:
                _ = (issue.goals, issue.misses)

        assert counter.count == 3, (
            f"get_all_issues lazy-loaded tags. Queries:\n{counter.explain()}"
        )

    def test_get_catalog_and_user_issues_is_flat_in_query_count(
        self, db_session, tagged_issues, test_user
    ):
        """Feeds GET /issues/catalog/, the Library screen.

        Five queries, not three: this read uses _CATALOG_OPTS, which loads the join
        rows and their drills on top of the tags, because the catalog DTO carries
        them. Still flat — the count does not move with the number of issues.
        """
        with QueryCounter(db_session) as counter:
            issues = get_catalog_and_user_issues(test_user["user_id"], db_session)
            for issue in issues:
                _ = (issue.goals, issue.misses, [l.drill for l in issue.issue_drills])

        assert counter.count == 5, (
            f"Library catalog read lazy-loaded a collection. Queries:\n{counter.explain()}"
        )

    def test_get_issue_by_id_loads_tags_before_they_are_touched(
        self, db_session, tagged_issues
    ):
        """session.get() takes options too.

        A total-count assertion cannot work for a single issue: lazy and eager both
        cost 3 queries. What separates them is when the tags load, so this asserts
        that touching the collections afterwards emits nothing.
        """
        target = tagged_issues[0].id

        issue = get_issue_by_id(target, db_session)

        with QueryCounter(db_session) as counter:
            goals = [g.goal for g in issue.goals]
            misses = [m.miss for m in issue.misses]

        assert sorted(goals) == ["BIG_MISS", "STRAIGHTER"]
        assert sorted(misses) == ["PULL", "SLICE"]
        assert counter.count == 0, (
            "Tags were not eager-loaded by get_issue_by_id — touching the collections "
            f"emitted {counter.count} extra queries:\n{counter.explain()}"
        )

    def test_query_count_does_not_grow_with_issue_count(self, db_session):
        """Query count must not grow with the number of issues."""
        suffix = uuid.uuid4().hex[:8]
        small = [_make_tagged_issue(db_session, f"Grow {suffix} a{i}") for i in range(2)]
        db_session.flush()
        db_session.expunge_all()

        with QueryCounter(db_session) as counter_small:
            for issue in get_issues_by_ids([i.id for i in small], db_session):
                _ = (issue.goals, issue.misses)

        larger = small + [
            _make_tagged_issue(db_session, f"Grow {suffix} b{i}") for i in range(6)
        ]
        db_session.flush()
        db_session.expunge_all()

        with QueryCounter(db_session) as counter_large:
            for issue in get_issues_by_ids([i.id for i in larger], db_session):
                _ = (issue.goals, issue.misses)

        assert counter_small.count == counter_large.count, (
            f"Query count grew from {counter_small.count} (2 issues) to "
            f"{counter_large.count} (8 issues) — that is an N+1."
        )


class TestCatalogDrillEagerLoading:
    """The catalog DTO also carries each issue's drills.

    `_issue_to_catalog_dto` walks `issue.issue_drills` to reach them, so
    `get_catalog_and_user_issues` has to eager-load that chain via `_CATALOG_OPTS`.
    Without it, building the Library payload costs a drill query per issue.
    """

    def test_list_catalog_issues_is_flat_in_query_count(self, db_session, test_user):
        from ....core.services.issue_authoring_service import list_catalog_issues

        suffix = uuid.uuid4().hex[:8]
        for i in range(4):
            issue = _make_tagged_issue(db_session, f"Catalog drills {suffix} {i}")
            drill = models.Drill(
                title=f"d{i}", task="t", success_signal="s", fault_indicator="f"
            )
            db_session.add(drill)
            db_session.flush()
            db_session.add(models.IssueDrill(issue_id=issue.id, drill_id=drill.id))
        db_session.flush()
        db_session.expunge_all()

        with QueryCounter(db_session) as counter:
            dtos = list_catalog_issues(test_user["user_id"], db_session)

        assert any(d.drills for d in dtos), "fixture should produce issues with drills"
        # issues + goals + misses + issue_drill + drills, regardless of how many
        # issues came back.
        assert counter.count == 5, (
            "list_catalog_issues should stay flat; a per-issue drill query means the "
            f"Library screen is 1+N. Queries:\n{counter.explain()}"
        )
