"""Helper class for AI model testing."""

import json
import inspect
from pathlib import Path
from datetime import datetime


class TestResultsManager:
    """Manages test results, analysis outputs, and file writing."""

    def __init__(self, results_dir: Path):
        """Initialize the results manager.
        
        Args:
            results_dir: Path to the directory where results will be saved.
        """
        self.results_dir = results_dir
        self.results_dir.mkdir(parents=True, exist_ok=True)
        
        self._test_results = []
        self._model_analysis_results = {}  # Now keyed by (model, test_file)
        self._results_file = None
        self._test_file_name = None  # Track which test file is running

    def initialize_results_file(self):
        """Initialize the results file path based on the test files that ran."""
        # Determine the test file names from results
        test_files = set()
        for _, _, test_file in self._test_results:
            if test_file:
                test_files.add(test_file)
        
        # Use the first test file name if available, otherwise use the set test file name
        if test_files:
            file_name_part = "_" + "_".join(sorted(test_files))
        elif self._test_file_name:
            file_name_part = f"_{self._test_file_name}"
        else:
            file_name_part = ""
        
        self._results_file = (
            self.results_dir / f"test_results{file_name_part}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        )
        return self._results_file

    def get_results_file(self):
        """Get the current results file, initializing if needed."""
        if self._results_file is None:
            self.initialize_results_file()
        return self._results_file

    def store_analysis_results(self, model: str, analysis_results: dict, test_file: str = ""):
        """Store analysis results for a model and test file.
        
        Args:
            model: Model name.
            analysis_results: Analysis results dictionary.
            test_file: Optional test file name. If not provided, it will be auto-detected.
        """
        # Auto-detect test file if not provided
        if not test_file:
            frame = inspect.currentframe()
            caller_frame = frame.f_back
            caller_file = Path(caller_frame.f_code.co_filename).stem
            test_file = caller_file
        
        # Store results keyed by (model, test_file) tuple
        key = (model, test_file)
        if key not in self._model_analysis_results:
            self._model_analysis_results[key] = analysis_results

    def add_test_result(self, test_name: str, model: str, status: str, details: str = "", test_file: str = ""):
        """Buffer a single test result.
        
        Args:
            test_name: Name of the test.
            model: Model name.
            status: Test status (PASSED or FAILED).
            details: Optional details about the test.
            test_file: Optional test file name. If not provided, it will be auto-detected.
        """
        # Auto-detect test file if not provided
        if not test_file:
            frame = inspect.currentframe()
            caller_frame = frame.f_back
            caller_file = Path(caller_frame.f_code.co_filename).stem
            test_file = caller_file
        
        result_line = f"  [{status}] {test_name}"
        if details:
            result_line += f" - {details}"

        self._test_results.append((model, result_line, test_file))

    def set_test_file_name(self, file_name: str):
        """Set the name of the test file being run.
        
        Args:
            file_name: Name of the test file (e.g., 'AI_test', 'fake_swing_text').
        """
        self._test_file_name = file_name

    def write_all_results(self):
        """Write all buffered test results to the file at once."""
        results_file = self.get_results_file()

        # Write header with test file information
        header = f"{'='*80}\n"
        header += f"TEST RESULTS - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        if self._test_file_name:
            header += f"TEST FILE: {self._test_file_name}\n"
        header += f"{'='*80}\n\n"

        with open(results_file, "w") as f:
            f.write(header)

        # Write results grouped by model
        current_model = None
        current_file = None
        
        for model, result_line, test_file in self._test_results:
            # Write model header when switching models
            if model != current_model or current_file != test_file:
                model_header = f"\n{'-'*80}\n"
                model_header += f"MODEL: {model}\n"
                model_header += f"{'-'*80}\n"
                model_header += f"TEST FILE: {test_file}\n\n"

                with open(results_file, "a") as f:
                    f.write(model_header)

                # Write analysis results for this model and test file (only once per model+test_file combo)
                key = (model, test_file)
                if key in self._model_analysis_results:
                    analysis_output = f"\n--- ANALYSIS RESULTS ---\n"
                    analysis_output += json.dumps(self._model_analysis_results[key], indent=2)
                    analysis_output += "\n\n--- TEST RESULTS ---\n"

                    with open(results_file, "a") as f:
                        f.write(analysis_output)

                current_model = model
                current_file = test_file

            # Write result
            with open(results_file, "a") as f:
                f.write(result_line + "\n")

        # Write summary
        total_tests = len(self._test_results)
        passed_tests = sum(1 for _, line, _ in self._test_results if "[PASSED]" in line)

        summary = f"\n{'='*80}\n"
        summary += f"SUMMARY: {passed_tests}/{total_tests} tests passed\n"
        summary += f"{'='*80}\n"

        with open(results_file, "a") as f:
            f.write(summary)
