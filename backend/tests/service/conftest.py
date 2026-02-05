import uuid
import pytest
from sqlalchemy import text
from ...core.infrastructure.db.session import SessionLocal


@pytest.fixture
def db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture
def test_user(db_session):
    user_id = uuid.uuid4()

    db_session.execute(
        text("INSERT INTO auth.users (id) VALUES (:id)"),
        {"id": user_id},
    )
    db_session.flush()

    return user_id
