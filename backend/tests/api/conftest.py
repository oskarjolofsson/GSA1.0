import pytest
from fastapi.testclient import TestClient

from ...app.main import app
from ...app.dependencies.db import get_db


@pytest.fixture()
def client(db_session):
    """API test client with overridden DB dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()
