import uuid
import pytest
from sqlalchemy import text, event
from ...core.infrastructure.db.session import SessionLocal
from ...core.infrastructure.db.engine import engine


@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()        # OUTER transaction

    session = SessionLocal(bind=connection)
    session.begin_nested()                  # SAVEPOINT

    # Restart SAVEPOINT after each commit
    @event.listens_for(session, "after_transaction_end")
    def restart_savepoint(sess, trans):
        if trans.nested and not trans._parent.nested:
            sess.begin_nested()

    try:
        yield session
    finally:
        session.close()
        transaction.rollback()              # UNDO EVERYTHING
        connection.close()


@pytest.fixture
def test_user(db_session):
    user_id = uuid.uuid4()

    db_session.execute(
        text("INSERT INTO auth.users (id) VALUES (:id)"),
        {"id": user_id},
    )
    db_session.flush()

    return user_id


@pytest.fixture
def mock_service_session(db_session, monkeypatch):
    """Replace the module-level db_session in analysis_service with the test session"""
    from ...core.services import analysis_service
    
    monkeypatch.setattr(analysis_service, "db_session", db_session)
    
    return db_session
