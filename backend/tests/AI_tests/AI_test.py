import os
import time
import sys
from pathlib import Path
import pytest
from sympy import pprint
from datetime import datetime

# Add the backend directory to the Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from app import app

BASE_DIR = Path(__file__).resolve().parent.parent.parent
NOTES_PATH = BASE_DIR / "tests" / "results" / "ai_tests" / "notes.txt"
OUTPUT_PATH = BASE_DIR / "tests" / "results" / "ai_tests" / "analysis_output.txt"
RESULTS_DIR = BASE_DIR / "tests" / "results" / "ai_tests"


@pytest.fixture(scope="module", autouse=True)
def setup_results_directory():
    """Create results directory if it doesn't exist."""
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    yield
    

@pytest.fixture(scope="module")
def flask_app():
    """Create and configure a Flask app for testing."""
    app.config["TESTING"] = True
    return app

@pytest.fixture(scope="module", params=[
    "gpt-5-nano", 
    "gpt-5",
    "gemini-2.5-flash",
    ])
def video_upload_result(request, flask_app):
    """Run the /upload_video endpoint with different models."""
    test_video_path = os.path.join(os.path.dirname(__file__), "test_video.mp4")
    
    # Write model header to results file
    write_model_header(request.param)
    
    model = request.param

    with open(test_video_path, "rb") as video_file:
        data = {
            "video": (video_file, "test_video.mp4"),
            "note": "",
            "start_time": "0",
            "end_time": "2",
            "user_id": "8oAXCb0Th2OohAOy96kFT3zMeCC2",
            "model": model,
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
    
    print_analysis_results(analysis_results, model)

    return {
        "response": response,
        "total": total,
        "json": json_data,
        "analysis_text": analysis_text,
        "analysis_results": analysis_results,
        "model": model,
    }


def test_upload_status_code(video_upload_result):
    model = video_upload_result["model"]
    
    try:
        assert video_upload_result["response"].status_code == 200, f"[{model}] Upload failed, status code not 200."
        write_test_result("test_upload_status_code", model, "PASSED", "Status code is 200")
    except AssertionError as e:
        write_test_result("test_upload_status_code", model, "FAILED", str(e))
        raise


def test_upload_is_fast_enough(video_upload_result):
    model = video_upload_result["model"]
    
    try:
        assert video_upload_result["total"] < 120, f"[{model}] Upload took too long: {video_upload_result['total']} seconds."
        write_test_result("test_upload_is_fast_enough", model, "PASSED", f"Completed in {video_upload_result['total']:.2f} seconds")
    except AssertionError as e:
        write_test_result("test_upload_is_fast_enough", model, "FAILED", str(e))
        raise


def test_response_has_correct_format(video_upload_result):
    model = video_upload_result["model"]
    json_data = video_upload_result["json"]
    
    try:
        assert "analysis_results" in json_data, f"[{model}] Response missing 'analysis_results' key."
        write_test_result("test_response_has_correct_format", model, "PASSED", "Response has correct format")
    except AssertionError as e:
        write_test_result("test_response_has_correct_format", model, "FAILED", str(e))
        raise


def test_analysis_text_is_not_empty(video_upload_result):
    model = video_upload_result["model"]
    text = video_upload_result["analysis_text"]
    
    try:
        assert isinstance(text, (str, list, dict)), f"[{model}] Analysis text is not a string, list, or dict."
        assert len(text) > 0, f"[{model}] Analysis text is empty."
        write_test_result("test_analysis_text_is_not_empty", model, "PASSED", "Analysis text is not empty")
    except AssertionError as e:
        write_test_result("test_analysis_text_is_not_empty", model, "FAILED", str(e))
        raise


def test_quick_summary_exists(video_upload_result):
    model = video_upload_result["model"]
    analysis_results = video_upload_result["analysis_results"]
    
    try:
        assert "quick_summary" in analysis_results, f"[{model}] quick_summary section is missing."
        assert "diagnosis" in analysis_results["quick_summary"], f"[{model}] diagnosis key is missing in quick_summary."
        assert "key_fix" in analysis_results["quick_summary"], f"[{model}] key_fix key is missing in quick_summary."
        write_test_result("test_quick_summary_exists", model, "PASSED", "Quick summary section exists with required keys")
    except AssertionError as e:
        write_test_result("test_quick_summary_exists", model, "FAILED", str(e))
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
        write_test_result("test_key_findings_structure", model, "PASSED", f"Key findings structure is valid ({len(analysis_results['key_findings'])} findings)")
    except AssertionError as e:
        write_test_result("test_key_findings_structure", model, "FAILED", str(e))
        raise


def test_video_breakdown_exists(video_upload_result):
    model = video_upload_result["model"]
    analysis_results = video_upload_result["analysis_results"]
    required_keys = ["address", "takeaway", "top", "impact", "finish"]
    
    try:
        assert "video_breakdown" in analysis_results, f"[{model}] video_breakdown section is missing."
        for key in required_keys:
            assert key in analysis_results["video_breakdown"], f"[{model}] {key} is missing in video_breakdown."
        write_test_result("test_video_breakdown_exists", model, "PASSED", "Video breakdown section exists with all required keys")
    except AssertionError as e:
        write_test_result("test_video_breakdown_exists", model, "FAILED", str(e))
        raise


def test_premium_suggestions_exists(video_upload_result):
    model = video_upload_result["model"]
    analysis_results = video_upload_result["analysis_results"]
    
    try:
        assert "premium_suggestions" in analysis_results, f"[{model}] premium_suggestions section is missing."
        assert "personal_drill_pack" in analysis_results["premium_suggestions"], f"[{model}] personal_drill_pack key is missing in premium_suggestions."
        assert isinstance(analysis_results["premium_suggestions"]["personal_drill_pack"], list), f"[{model}] personal_drill_pack is not a list."
        write_test_result("test_premium_suggestions_exists", model, "PASSED", "Premium suggestions section exists")
    except AssertionError as e:
        write_test_result("test_premium_suggestions_exists", model, "FAILED", str(e))
        raise


# ------------------------------- Helper Methods ------------------------------- #

# Global variables to buffer test results
_test_results = []
_model_headers = {}
_results_file = None

def initialize_results_file():
    """Initialize the results file path (file not created until write_all_results is called)."""
    global _results_file
    _results_file = RESULTS_DIR / f"test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    return _results_file


def get_results_file():
    """Get the current results file, initializing if needed."""
    global _results_file
    if _results_file is None:
        initialize_results_file()
    return _results_file


def write_model_header(model):
    """Buffer a header for each model being tested."""
    global _model_headers
    if model not in _model_headers:
        _model_headers[model] = len(_test_results)


def write_test_result(test_name, model, status, details=""):
    """Buffer a single test result."""
    global _test_results
    
    result_line = f"  [{status}] {test_name}"
    if details:
        result_line += f" - {details}"
    
    _test_results.append((model, result_line))


def write_all_results():
    """Write all buffered test results to the file at once."""
    global _test_results, _model_headers
    
    results_file = get_results_file()
    
    # Write header
    header = f"{'='*80}\n"
    header += f"TEST RESULTS - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
    header += f"{'='*80}\n\n"
    
    with open(results_file, "w") as f:
        f.write(header)
    
    # Write results grouped by model
    current_model = None
    for model, result_line in _test_results:
        # Write model header when switching models
        if model != current_model:
            model_header = f"\n{'-'*80}\n"
            model_header += f"MODEL: {model}\n"
            model_header += f"{'-'*80}\n"
            
            with open(results_file, "a") as f:
                f.write(model_header)
            current_model = model
        
        # Write result
        with open(results_file, "a") as f:
            f.write(result_line + "\n")
    
    # Write summary
    total_tests = len(_test_results)
    passed_tests = sum(1 for _, line in _test_results if "[PASSED]" in line)
    
    summary = f"\n{'='*80}\n"
    summary += f"SUMMARY: {passed_tests}/{total_tests} tests passed\n"
    summary += f"{'='*80}\n"
    
    with open(results_file, "a") as f:
        f.write(summary)


def print_analysis_results(analysis_results, model):
    """Helper method to print analysis results in a readable format."""
    print(f"\nAnalysis Results for Model: {model}")
    for section, content in analysis_results.items():
        print(f"\n=== {section.upper()} ===")
        pprint(content)

