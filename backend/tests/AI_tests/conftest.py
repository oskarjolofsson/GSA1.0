import pytest
from pathlib import Path
from test_helpers import TestResultsManager

BASE_DIR = Path(__file__).resolve().parent.parent.parent
RESULTS_DIR = BASE_DIR / "tests" / "results" / "ai_tests"

# Initialize results manager
results_manager = TestResultsManager(RESULTS_DIR)


def pytest_collection_modifyitems(session, config, items):
    """Called after test collection is complete."""
    # Detect which test files are running
    test_files = set()
    for item in items:
        # Get the test file name without extension
        test_file = Path(item.fspath).stem
        test_files.add(test_file)
    
    # If only one test file, use its name
    if len(test_files) == 1:
        results_manager.set_test_file_name(list(test_files)[0])
    elif len(test_files) > 1:
        # If multiple test files, use a combined name
        results_manager.set_test_file_name("_".join(sorted(test_files)))


def pytest_sessionfinish(session, exitstatus):
    """Write all test results to file after tests complete."""
    results_manager.write_all_results()

