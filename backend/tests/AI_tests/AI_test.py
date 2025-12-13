import os
import time
import sys
from pathlib import Path
import pytest
from sympy import pprint

# Add the backend directory to the Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from app import app
from test_helpers import TestResultsManager
from request_template import RequestTemplate

BASE_DIR = Path(__file__).resolve().parent.parent.parent
NOTES_PATH = BASE_DIR / "tests" / "results" / "ai_tests" / "notes.txt"
OUTPUT_PATH = BASE_DIR / "tests" / "results" / "ai_tests" / "analysis_output.txt"
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
    #"gemini-2.5-flash-lite",   # Broken formatting
    #"gemini-2.5-pro",          # Broken formatting
    "gemini-3-pro-preview",
    ])
def video_upload_result(request, flask_app):
    """Run the /upload_video endpoint with different models."""
    model = request.param

    # Create request using template
    request_data = request_template.create_default_upload_video_request(model)
    file_handle = request_data["file_handle"]
    data = request_data["data"]

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
        analysis_text = json_data.get("analysis_results", "")
        analysis_results = json_data.get("analysis_results", {})
        
        # Store analysis results for output
        results_manager.store_analysis_results(model, analysis_results)

        return {
            "response": response,
            "total": total,
            "json": json_data,
            "analysis_text": analysis_text,
            "analysis_results": analysis_results,
            "model": model,
        }
    finally:
        file_handle.close()


def test_upload_status_code(video_upload_result):
    model = video_upload_result["model"]
    
    try:
        assert video_upload_result["response"].status_code == 200, f"[{model}] Upload failed, status code not 200."
        results_manager.add_test_result("test_upload_status_code", model, "PASSED", "Status code is 200")
    except AssertionError as e:
        results_manager.add_test_result("test_upload_status_code", model, "FAILED", str(e))
        raise


def test_upload_is_fast_enough(video_upload_result):
    model = video_upload_result["model"]
    
    try:
        assert video_upload_result["total"] < 120, f"[{model}] Upload took too long: {video_upload_result['total']} seconds."
        results_manager.add_test_result("test_upload_is_fast_enough", model, "PASSED", f"Completed in {video_upload_result['total']:.2f} seconds")
    except AssertionError as e:
        results_manager.add_test_result("test_upload_is_fast_enough", model, "FAILED", str(e))
        raise


def test_response_has_correct_format(video_upload_result):
    model = video_upload_result["model"]
    json_data = video_upload_result["json"]
    
    try:
        assert "analysis_results" in json_data, f"[{model}] Response missing 'analysis_results' key."
        results_manager.add_test_result("test_response_has_correct_format", model, "PASSED", "Response has correct format")
    except AssertionError as e:
        results_manager.add_test_result("test_response_has_correct_format", model, "FAILED", str(e))
        raise


def test_analysis_text_is_not_empty(video_upload_result):
    model = video_upload_result["model"]
    text = video_upload_result["analysis_text"]
    
    try:
        assert isinstance(text, (str, list, dict)), f"[{model}] Analysis text is not a string, list, or dict."
        assert len(text) > 0, f"[{model}] Analysis text is empty."
        results_manager.add_test_result("test_analysis_text_is_not_empty", model, "PASSED", "Analysis text is not empty")
    except AssertionError as e:
        results_manager.add_test_result("test_analysis_text_is_not_empty", model, "FAILED", str(e))
        raise


def test_quick_summary_exists(video_upload_result):
    model = video_upload_result["model"]
    analysis_results = video_upload_result["analysis_results"]
    
    try:
        assert "quick_summary" in analysis_results, f"[{model}] quick_summary section is missing."
        assert "diagnosis" in analysis_results["quick_summary"], f"[{model}] diagnosis key is missing in quick_summary."
        assert "key_fix" in analysis_results["quick_summary"], f"[{model}] key_fix key is missing in quick_summary."
        results_manager.add_test_result("test_quick_summary_exists", model, "PASSED", "Quick summary section exists with required keys")
    except AssertionError as e:
        results_manager.add_test_result("test_quick_summary_exists", model, "FAILED", str(e))
        raise


def test_key_findings_structure(video_upload_result):
    model = video_upload_result["model"]
    analysis_results = video_upload_result["analysis_results"]
    
    try:
        assert "key_findings" in analysis_results, f"[{model}] key_findings section is missing."
        assert isinstance(analysis_results["key_findings"], list), f"[{model}] key_findings is not a list."
        for finding in analysis_results["key_findings"]:
            assert "title" in finding, f"[{model}] title key is missing in a key_finding."
            assert "severity" in finding, f"[{model}] severity key is missing in a key_finding."
            assert finding["severity"] in ["high", "medium", "low"], f"[{model}] severity value is invalid."
        results_manager.add_test_result("test_key_findings_structure", model, "PASSED", f"Key findings structure is valid ({len(analysis_results['key_findings'])} findings)")
    except AssertionError as e:
        results_manager.add_test_result("test_key_findings_structure", model, "FAILED", str(e))
        raise


def test_video_breakdown_exists(video_upload_result):
    model = video_upload_result["model"]
    analysis_results = video_upload_result["analysis_results"]
    required_keys = ["address", "takeaway", "top", "impact", "finish"]
    
    try:
        assert "video_breakdown" in analysis_results, f"[{model}] video_breakdown section is missing."
        for key in required_keys:
            assert key in analysis_results["video_breakdown"], f"[{model}] {key} is missing in video_breakdown."
        results_manager.add_test_result("test_video_breakdown_exists", model, "PASSED", "Video breakdown section exists with all required keys")
    except AssertionError as e:
        results_manager.add_test_result("test_video_breakdown_exists", model, "FAILED", str(e))
        raise


def test_premium_suggestions_exists(video_upload_result):
    model = video_upload_result["model"]
    analysis_results = video_upload_result["analysis_results"]
    
    try:
        assert "premium_suggestions" in analysis_results, f"[{model}] premium_suggestions section is missing."
        assert "personal_drill_pack" in analysis_results["premium_suggestions"], f"[{model}] personal_drill_pack key is missing in premium_suggestions."
        assert isinstance(analysis_results["premium_suggestions"]["personal_drill_pack"], list), f"[{model}] personal_drill_pack is not a list."
        results_manager.add_test_result("test_premium_suggestions_exists", model, "PASSED", "Premium suggestions section exists")
    except AssertionError as e:
        results_manager.add_test_result("test_premium_suggestions_exists", model, "FAILED", str(e))
        raise
