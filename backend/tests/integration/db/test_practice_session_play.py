import pytest

from core.services import practice_session_service as svc
from core.infrastructure.db.repositories import practice_sessions as repo


def test_start_persists_session_type_and_notes(db_session, test_user):
    """A play session is started with its type and free-text notes stored."""
    dto = svc.record_practice_session_start(
        user_id=test_user["user_id"],
        analysis_issue_id=None,
        session=db_session,
        session_type="play",
        notes="Striped it on the back nine",
    )
    row = repo.get_practice_session_by_id(dto.id, db_session)
    assert row.session_type == "play"
    assert row.notes == "Striped it on the back nine"
    assert row.status == "in_progress"


def test_start_defaults_when_not_provided(db_session, test_user):
    dto = svc.record_practice_session_start(
        user_id=test_user["user_id"],
        analysis_issue_id=None,
        session=db_session,
    )
    row = repo.get_practice_session_by_id(dto.id, db_session)
    assert row.session_type is None
    assert row.notes is None


def test_retest_is_no_longer_a_legal_session_type(db_session, test_user):
    """The inverse of the test this replaces.

    'retest' used to be kept legal so historical rows validated, and a test guarded that
    decision. 20260805000100 backfilled those rows to 'range' and narrowed the constraint,
    so the value is now rejected outright -- which is the thing worth guarding, since a
    silently-accepted dead value is how it survived this long.
    """
    with pytest.raises(Exception):
        svc.record_practice_session_start(
            user_id=test_user["user_id"],
            analysis_issue_id=None,
            session=db_session,
            session_type="retest",
        )
        db_session.flush()


def test_completed_play_session_counts_toward_activity(db_session, test_user):
    """Logging a round (start + complete) earns a streak square, same as range."""
    dto = svc.record_practice_session_start(
        user_id=test_user["user_id"],
        analysis_issue_id=None,
        session=db_session,
        session_type="play",
    )
    svc.record_practice_session_completion(dto.id, test_user["user_id"], db_session)

    counts = repo.get_completed_session_counts_by_day(test_user["user_id"], "UTC", db_session)
    assert sum(count for _day, _area, count in counts) >= 1
