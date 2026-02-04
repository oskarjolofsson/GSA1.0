import uuid
import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
import dotenv
from ....core.infrastructure.db.session import SessionLocal

DATABASE_URL = os.getenv("DATABASE_URL")
DATABASE_PASSWORD = os.getenv("DATABASE_PASSWORD")
engine = create_engine(DATABASE_URL)


@pytest.fixture
def db_session():
    session = SessionLocal()
    print("Databse URL:", DATABASE_URL)
    print("Database Password:", DATABASE_PASSWORD)
    try:
        yield session
    finally:
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
