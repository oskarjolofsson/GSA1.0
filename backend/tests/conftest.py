import uuid
import pytest
import time
from sqlalchemy import text
from supabase import create_client, Client
from core.infrastructure.db.engine import engine
from core.infrastructure.db.session import SessionLocal
from core.config import SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLL_KEY


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


@pytest.fixture(scope="session")
def supabase_client() -> Client:
    """Create a Supabase client for authentication testing."""
    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    return client


@pytest.fixture(scope="session")
def supabase_admin_client() -> Client:
    """Create a Supabase admin client with service role key for user management."""
    admin_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLL_KEY)
    return admin_client


@pytest.fixture(scope="function")
def test_user(supabase_client: Client, supabase_admin_client: Client):
    """
    Function-scoped authenticated test user.
    Creates a real Supabase user and returns the bearer token.
    Cleans up the user after the test completes.
    """
    # Generate unique test user credentials with simpler email format
    # Use timestamp + random string to ensure uniqueness and validity
    unique_id = str(uuid.uuid4().hex)[:8]
    timestamp = int(time.time())
    test_email = f"test{timestamp}{unique_id}@test.local".strip()  # Ensure no spaces and valid email format
    test_password = "TestPassword123!"
    
    # Sign up user with Supabase
    user = supabase_admin_client.auth.admin.create_user({
        "email": test_email,
        "password": test_password,
        "email_confirm": True,
    })
    
    response = supabase_client.auth.sign_in_with_password({
        "email": test_email,
        "password": test_password,
    })
    
    # Extract the access token (bearer token)
    access_token = response.session.access_token
    user_id = response.user.id
    
    yield {
        "access_token": access_token,
        "user_id": user_id,
        "email": test_email
    }
    
    # Cleanup: Delete test user using admin client
    try:
        supabase_admin_client.auth.admin.delete_user(user_id)
    except Exception as e:
        # Log but don't fail the test if cleanup fails
        print(f"Warning: Failed to cleanup test user {user_id}: {e}")
