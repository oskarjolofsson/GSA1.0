import time
import sys
from pathlib import Path
import pytest
from sympy import pprint
from app import app

# Add the backend directory to the Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from test_helpers import TestResultsManager
from request_template import RequestTemplate


BASE_DIR = Path(__file__).resolve().parent.parent.parent
RESULTS_DIR = BASE_DIR / "tests" / "results" / "ai_tests"

# Initialize results manager and request template
results_manager = TestResultsManager(RESULTS_DIR)
request_template = RequestTemplate(BASE_DIR)


@pytest.fixture(scope="module", autouse=True)
def setup_results_directory():
    """Create results directory if it doesn't exist."""
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    yield
    results_manager.write_all_results()


@pytest.fixture(scope="module")
def flask_app():
    """Create and configure a Flask app for testing."""
    app.config["TESTING"] = True
    return app


@pytest.fixture(scope="module", params=[
    "gpt-5-nano",
    "gpt-5",
    "gemini-2.5-flash",
    "gemini-3-pro-preview",
])
def fake_swing_upload_result(request, flask_app):
    """Run the /upload_video endpoint with non-golf video (fake swing)."""
    model = request.param

    # Create request using template
    request_data = request_template.create_default_upload_video_request(model)
    file_handle = request_data["file_handle"]
    data = request_data["data"]
    
    # Update video filename for non-golf video
    data["video"] = (file_handle, "non_golf.mp4")

    try:
        t1 = time.time()
        with flask_app.test_client() as client:
            response = client.post(
                request_template.get_upload_video_endpoint(),
                data=data,
                content_type=request_template.get_content_type(),
            )
        t2 = time.time()
        total = t2 - t1

        json_data = response.get_json()
        analysis_results = json_data.get("analysis_results", {})

        results_manager.store_analysis_results(model, analysis_results)
        print_analysis_results(analysis_results, model)

        return {
            "response": response,
            "total": total,
            "json": json_data,
            "analysis_results": analysis_results,
            "model": model,
        }
    finally:
        file_handle.close()


def test_fake_swing_status_code(fake_swing_upload_result):
    model = fake_swing_upload_result["model"]

    try:
        assert fake_swing_upload_result["response"].status_code == 200, f"[{model}] Upload failed, status code not 200."
        results_manager.add_test_result("test_fake_swing_status_code", model, "PASSED", "Status code is 200")
    except AssertionError as e:
        results_manager.add_test_result("test_fake_swing_status_code", model, "FAILED", str(e))
        raise


def test_fake_swing_detection_fails(fake_swing_upload_result):
    model = fake_swing_upload_result["model"]
    analysis_results = fake_swing_upload_result["analysis_results"]

    try:
        assert "success" in analysis_results, f"[{model}] 'success' key missing in analysis_results."
        assert analysis_results["success"] is False, f"[{model}] Expected success to be False for non-golf video, but got {analysis_results['success']}."
        results_manager.add_test_result("test_fake_swing_detection_fails", model, "PASSED", "Success is False as expected")
    except AssertionError as e:
        results_manager.add_test_result("test_fake_swing_detection_fails", model, "FAILED", str(e))
        raise


def test_fake_swing_response_structure(fake_swing_upload_result):
    model = fake_swing_upload_result["model"]
    json_data = fake_swing_upload_result["json"]

    try:
        assert "analysis_results" in json_data, f"[{model}] Response missing 'analysis_results' key."
        results_manager.add_test_result("test_fake_swing_response_structure", model, "PASSED", "Response has correct structure")
    except AssertionError as e:
        results_manager.add_test_result("test_fake_swing_response_structure", model, "FAILED", str(e))
        raise


def test_fake_swing_error_message_present(fake_swing_upload_result):
    model = fake_swing_upload_result["model"]
    analysis_results = fake_swing_upload_result["analysis_results"]

    try:
        assert "error" in analysis_results or "message" in analysis_results, f"[{model}] No error or message found in analysis_results."
        results_manager.add_test_result("test_fake_swing_error_message_present", model, "PASSED", "Error message is present")
    except AssertionError as e:
        results_manager.add_test_result("test_fake_swing_error_message_present", model, "FAILED", str(e))
        raise


def print_analysis_results(analysis_results, model):
    """Helper method to print analysis results in a readable format."""
    print(f"\nAnalysis Results for Model: {model}")
    for section, content in analysis_results.items():
        print(f"\n=== {section.upper()} ===")
        pprint(content)