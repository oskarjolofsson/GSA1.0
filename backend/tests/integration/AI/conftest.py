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

from core.infrastructure.ai import analyze_video, get_model
from core.services.analysis_service import issues_offered_to_ai

from ....core.infrastructure.db.session import SessionLocal

DATABASE_URL = os.getenv("DATABASE_URL")
DATABASE_PASSWORD = os.getenv("DATABASE_PASSWORD")
engine = create_engine(DATABASE_URL)


@pytest.fixture(scope="module")
def db_session():
    session = SessionLocal()
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
def analysis_result(gemini_api_key, test_video_path, db_session, test_user):
    """Run analysis once and share result across all tests."""
    return analyze_video(
        video_path=test_video_path[0],
        issues=issues_offered_to_ai(test_user["user_id"], db_session),
        model=get_model(),
    )


@pytest.fixture(scope="module")
def analysis_result_with_context(gemini_api_key, test_video_path, db_session, test_user):
    """Run analysis with user context once."""
    return analyze_video(
        video_path=test_video_path[0],
        issues=issues_offered_to_ai(test_user["user_id"], db_session),
        shape="draw",
        height="mid",
        misses="right",
        extra=None,
        model=get_model(),
    )


@pytest.fixture(scope="module")
def analysis_result_non_golf(gemini_api_key, test_video_path, db_session, test_user):
    """Run analysis once and share result across all tests."""
    return analyze_video(
        video_path=test_video_path[1],
        issues=issues_offered_to_ai(test_user["user_id"], db_session),
        model=get_model(),
    )
