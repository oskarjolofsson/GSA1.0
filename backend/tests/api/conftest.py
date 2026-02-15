import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.dependencies.db import get_db


@pytest.fixture()
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def auth_headers(test_user):
    """
    Generate authentication headers for test requests.
    
    Args:
        test_user: Test user fixture that provides access_token
        
    Returns:
        dict: Headers with Bearer token for authentication
    """
    return {"Authorization": f"Bearer {test_user['access_token']}"}

