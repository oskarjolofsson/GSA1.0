import pytest
import os
from pathlib import Path
import sys

# Add backend to path
backend_dir = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(backend_dir))

from core.infrastructure.AI.google.client import GoogleAnalysisClient


@pytest.fixture(scope="module")
def test_video_path():
    """Path to the test video file."""
    video_path = Path(__file__).parent.parent.parent / "AI_tests" / "test_video.mp4"
    
    if not video_path.exists():
        pytest.skip(f"Test video not found at {video_path}")
    
    return str(video_path)


@pytest.fixture(scope="module")
def gemini_api_key():
    """Gemini API key from environment."""
    api_key = os.getenv("GEMINI_API_KEY")
    
    if not api_key:
        pytest.skip("GEMINI_API_KEY environment variable not set")
    
    return api_key


@pytest.fixture(scope="module")
def google_client(gemini_api_key):
    """Initialized Google Analysis Client."""
    return GoogleAnalysisClient()


@pytest.fixture(scope="module")
def analysis_result(google_client, test_video_path):
    """Run analysis once and share result across all tests."""
    print("\n🔄 Running video analysis (once for all tests)...")
    result = google_client.analyze_video(video_path=test_video_path)
    print(f"✓ Analysis complete: {len(result.get('issues', []))} issues found")
    return result


@pytest.fixture(scope="module")
def analysis_result_with_context(google_client, test_video_path):
    """Run analysis with user context once."""
    print("\n🔄 Running video analysis with user context...")
    result = google_client.analyze_video(
        video_path=test_video_path,
        shape="draw",
        height="mid",
        misses="right",
        extra=None
    )
    print(f"✓ Analysis with context complete")
    return result
