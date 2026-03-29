import pytest
import os
from pathlib import Path
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine

# Load environment variables
load_dotenv()

# Add backend to path
backend_dir = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(backend_dir))

from core.infrastructure.AI.google.client import GoogleAnalysisClient

from ....core.infrastructure.db.session import SessionLocal

DATABASE_URL = os.getenv("DATABASE_URL")
DATABASE_PASSWORD = os.getenv("DATABASE_PASSWORD")
engine = create_engine(DATABASE_URL)


@pytest.fixture(scope="module")
def db_session():
    session = SessionLocal()
    print("Databse URL:", DATABASE_URL)
    print("Database Password:", DATABASE_PASSWORD)
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="module")
def test_video_path():
    """Path to the test video file."""
    video_paths = [
        backend_dir / "uploads" / "video" / "golf.mp4",
        backend_dir / "uploads" / "video" / "non_golf.mp4"
        ]
    
    for video_path in video_paths:
        if not video_path.exists():
            print(f"\nTest video not found at {video_path}. Skipping tests that require video analysis.")
            pytest.skip(f"Test video not found at {video_path}")
    
    return [str(path) for path in video_paths]


@pytest.fixture(scope="module")
def gemini_api_key():
    """Gemini API key from environment."""
    api_key = os.getenv("GEMINI_API_KEY")
    
    if not api_key:
        print("\nGEMINI_API_KEY environment variable not set. Skipping tests that require Gemini API access.")
        pytest.skip("GEMINI_API_KEY environment variable not set")
    return api_key


@pytest.fixture(scope="module")
def google_client(gemini_api_key):
    """Initialized Google Analysis Client."""
    return GoogleAnalysisClient()


@pytest.fixture(scope="module")
def analysis_result(google_client, test_video_path, db_session, test_user):
    """Run analysis once and share result across all tests."""
    result = google_client.analyze_video(video_path=test_video_path[0], db_session=db_session, user_id=test_user["user_id"])
    return result


@pytest.fixture(scope="module")
def analysis_result_with_context(google_client, test_video_path, db_session, test_user):
    """Run analysis with user context once."""
    result = google_client.analyze_video(
        video_path=test_video_path[0],  # Use the first video for this test
        user_id=test_user["user_id"],
        shape="draw",
        height="mid",
        misses="right",
        extra=None,
        db_session=db_session
    )
    return result


@pytest.fixture(scope="module")
def analysis_result_non_golf(google_client, test_video_path, db_session):
    """Run analysis once and share result across all tests."""
    result = google_client.analyze_video(video_path=test_video_path[1], db_session=db_session)
    return result
