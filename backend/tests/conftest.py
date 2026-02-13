import uuid
import pytest
from sqlalchemy import text
from core.infrastructure.db.engine import engine
from core.infrastructure.db.session import SessionLocal


@pytest.fixture(scope="function")
def db_session():
    """Function-scoped session for fast, isolated tests."""
    connection = engine.connect()
    transaction = connection.begin()
    session = SessionLocal(bind=connection)
    
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture(scope="function")
def test_user(db_session):
    """Function-scoped test user for fast tests."""
    user_id = uuid.uuid4()
    db_session.execute(
        text("INSERT INTO auth.users (id) VALUES (:id)"),
        {"id": user_id},
    )
    db_session.flush()
    return user_id
