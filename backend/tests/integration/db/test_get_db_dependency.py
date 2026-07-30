"""The request-scoped transaction boundary.

Every composite write in the app — most visibly the admin compose endpoint, which
writes an issue, its tags, new drills and their links in one request — depends on
`get_db` committing once at the end and rolling back on any exception. Repositories
only ever flush, so this dependency is the entire atomicity guarantee.

It cannot be covered by an API test: `tests/api/conftest.py` overrides `get_db` with
a bare `yield db_session`, replacing the commit/rollback wrapper with nothing. These
tests drive the real dependency directly and check the committed state from a
separate connection.

Scope of the guarantee: these assert the observable behaviour, not any particular
line. Deleting the explicit `db.rollback()` does not fail them, because the
`finally: db.close()` discards uncommitted work on its own. What they do catch is a
genuinely wrong boundary — committing on the error path, or not committing on the
success path.
"""

import uuid

import pytest
from sqlalchemy import text

from ....app.dependencies.db import get_db
from ....core.infrastructure.db.engine import engine
from ....core.infrastructure.db.models.Issue import Issue


def _exists(title: str) -> bool:
    """Look from outside any test transaction, so only committed rows count."""
    with engine.connect() as connection:
        return (
            connection.execute(
                text("SELECT 1 FROM issues WHERE title = :t"), {"t": title}
            ).first()
            is not None
        )


def _purge(title: str) -> None:
    with engine.connect() as connection:
        connection.execute(text("DELETE FROM issues WHERE title = :t"), {"t": title})
        connection.commit()


@pytest.fixture()
def probe_title(request):
    """A unique issue title, deleted afterwards no matter how the test ends.

    These tests drive the real get_db, so their writes are real commits against the
    configured database rather than rolled-back test-transaction writes. If an
    assertion fails — which is exactly what happens when the transaction boundary is
    broken — the row is left behind unless something cleans it up here.
    """
    titles = []

    def make(label: str) -> str:
        title = f"get_db {label} {uuid.uuid4().hex[:8]}"
        titles.append(title)
        return title

    yield make
    for title in titles:
        _purge(title)


def test_rolls_back_when_the_request_raises(probe_title):
    """An exception mid-request must leave nothing behind, even though the write was
    already flushed to the database."""
    title = probe_title("rollback")
    generator = get_db()
    session = next(generator)

    session.add(Issue(title=title, description="should not survive"))
    session.flush()

    with pytest.raises(RuntimeError):
        generator.throw(RuntimeError("request blew up"))

    assert not _exists(title), "flushed rows survived an exception — get_db did not roll back"


def test_commits_when_the_request_completes(probe_title):
    """The other half: a clean request has to persist."""
    title = probe_title("commit")
    generator = get_db()
    session = next(generator)

    session.add(Issue(title=title, description="should survive"))
    session.flush()

    # Exhausting the generator is what FastAPI does when the handler returns.
    with pytest.raises(StopIteration):
        next(generator)

    assert _exists(title), "a clean request did not commit"


def test_partial_write_does_not_survive_a_later_failure(probe_title):
    """The compose shape: several flushes, then a failure. All of it goes."""
    first = probe_title("partial-a")
    second = probe_title("partial-b")
    generator = get_db()
    session = next(generator)

    session.add(Issue(title=first, description="first"))
    session.flush()
    session.add(Issue(title=second, description="second"))
    session.flush()

    with pytest.raises(ValueError):
        generator.throw(ValueError("failed after two flushes"))

    assert not _exists(first)
    assert not _exists(second)
