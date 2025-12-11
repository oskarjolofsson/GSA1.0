import os
import time
import sys
from pathlib import Path
import pytest

# Add the backend directory to the Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from app import app

BASE_DIR = Path(__file__).resolve().parent.parent.parent
NOTES_PATH = BASE_DIR / "tests" / "AI_tests" / "notes.txt"
OUTPUT_PATH = BASE_DIR / "tests" / "AI_tests" / "analysis_output.txt"


@pytest.fixture(scope="module")
def flask_app():
    """Create and configure a Flask app for testing."""
    app.config["TESTING"] = True
    return app


@pytest.fixture(scope="module")
def video_upload_result(flask_app):
    """Run the /upload_video endpoint once and share the result across all tests."""
    test_video_path = os.path.join(os.path.dirname(__file__), "test_video.mp4")

    with open(test_video_path, "rb") as video_file:
        data = {
            "video": (video_file, "test_video.mp4"),
            "note": "",
            "start_time": "0",
            "end_time": "2",
            "user_id": "8oAXCb0Th2OohAOy96kFT3zMeCC2",
            "model": "gpt-5-nano",
        }

        t1 = time.time()
        with flask_app.test_client() as client:
            response = client.post(
                "/api/v1/analysis/upload_video",
                data=data,
                content_type="multipart/form-data",
            )
        t2 = time.time()
        total = t2 - t1

    json_data = response.get_json()
    analysis_text = json_data.get("analysis_results", "")
    analysis_results = json_data.get("analysis_results", {})

    return {
        "response": response,
        "total": total,
        "json": json_data,
        "analysis_text": analysis_text,
        "analysis_results": analysis_results,
    }


def test_upload_status_code(video_upload_result):
    assert video_upload_result["response"].status_code == 200, "Upload failed, status code not 200."


def test_upload_is_fast_enough(video_upload_result):
    assert video_upload_result["total"] < 120, f"Upload took too long: {video_upload_result['total']} seconds."


def test_response_has_correct_format(video_upload_result):
    json_data = video_upload_result["json"]
    assert "analysis_results" in json_data, "Response missing 'analysis_results' key."


def test_analysis_text_is_not_empty(video_upload_result):
    text = video_upload_result["analysis_text"]
    assert isinstance(text, (str, list, dict)), "Analysis text is not a string, list, or dict."
    assert len(text) > 0, "Analysis text is empty."


def test_quick_summary_exists(video_upload_result):
    analysis_results = video_upload_result["analysis_results"]
    assert "quick_summary" in analysis_results, "quick_summary section is missing."
    assert "diagnosis" in analysis_results["quick_summary"], "diagnosis key is missing in quick_summary."
    assert "key_fix" in analysis_results["quick_summary"], "key_fix key is missing in quick_summary."


def test_key_findings_structure(video_upload_result):
    analysis_results = video_upload_result["analysis_results"]
    assert "key_findings" in analysis_results, "key_findings section is missing."
    assert isinstance(analysis_results["key_findings"], list), "key_findings is not a list."
    for finding in analysis_results["key_findings"]:
        assert "title" in finding, "title key is missing in a key_finding."
        assert "severity" in finding, "severity key is missing in a key_finding."
        assert finding["severity"] in ["high", "medium", "low"], "severity value is invalid."


def test_video_breakdown_exists(video_upload_result):
    analysis_results = video_upload_result["analysis_results"]
    assert "video_breakdown" in analysis_results, "video_breakdown section is missing."
    required_keys = ["address", "takeaway", "top", "impact", "finish"]
    for key in required_keys:
        assert key in analysis_results["video_breakdown"], f"{key} is missing in video_breakdown."


def test_premium_suggestions_exists(video_upload_result):
    analysis_results = video_upload_result["analysis_results"]
    assert "premium_suggestions" in analysis_results, "premium_suggestions section is missing."
    assert "personal_drill_pack" in analysis_results["premium_suggestions"], "personal_drill_pack key is missing in premium_suggestions."
    assert isinstance(analysis_results["premium_suggestions"]["personal_drill_pack"], list), "personal_drill_pack is not a list."