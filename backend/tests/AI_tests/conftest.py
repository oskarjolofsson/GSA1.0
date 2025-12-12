import pytest


def pytest_sessionfinish(session, exitstatus):
    """Hook that runs after all tests have completed."""
    # Import the test module to access the helper functions
    from AI_test import write_all_results, _test_results
    
    # Only write results if there are any
    if _test_results:
        write_all_results()
