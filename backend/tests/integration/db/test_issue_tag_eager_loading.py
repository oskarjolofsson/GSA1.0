"""Query-count guards for goal/miss tag eager loading.

Issue.goals and Issue.misses declare no `lazy=`, so they default to lazy="select".
Once the response DTOs started including tags, every issue read became a candidate
for an N+1: one SELECT for the issues, then two more PER ISSUE as the mapper walked
the collections. On the app's home screen that is 20 needless round trips for a
golfer with 10 issues.

`_TAG_OPTS` in repositories/issues.py fixes it with selectinload. These tests are
what stop it from silently regressing — a future query added without `.options()`
looks perfectly fine in review and only shows up as a slow screen in production.

The assertion is on query COUNT, not on wall time, so it is deterministic.
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
    """An issue carrying two goals and two misses, so a lazy load would be visible."""
    issue = models.Issue(title=title, description="tag eager-loading fixture")
    issue.goals.append(models.IssueGoal(goal="STRAIGHTER"))
    issue.goals.append(models.IssueGoal(goal="BIG_MISS"))
    issue.misses.append(models.IssueMiss(miss="SLICE"))
    issue.misses.append(models.IssueMiss(miss="PULL"))
    return create_issue(issue, session)


@pytest.fixture()
def tagged_issues(db_session):
    """Five tagged issues. Five is enough that an N+1 is unmistakable: eager loading
    stays flat at 3 queries while lazy loading would climb to 11."""
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
        """This one feeds GET /issues/catalog/, the expo Library screen."""
        with QueryCounter(db_session) as counter:
            issues = get_catalog_and_user_issues(test_user["user_id"], db_session)
            for issue in issues:
                _ = (issue.goals, issue.misses)

        assert counter.count == 3, (
            f"Library catalog read lazy-loaded tags. Queries:\n{counter.explain()}"
        )

    def test_get_issue_by_id_loads_tags_before_they_are_touched(
        self, db_session, tagged_issues
    ):
        """session.get() takes options too — an easy one to miss.

        Note this cannot be a total-query-count assertion: for a SINGLE issue, lazy
        and eager loading both cost 3 queries (the fetch plus one per collection), so
        a count check here passes either way and proves nothing. What distinguishes
        them is WHEN the tags load. Eagerly loaded collections are already populated,
        so touching them emits zero further queries.
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
        """The actual N+1 property: doubling the rows must not change the query count."""
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
