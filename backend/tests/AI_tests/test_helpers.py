"""Helper class for AI model testing."""

import json
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
        self._model_analysis_results = {}
        self._results_file = None

    def initialize_results_file(self):
        """Initialize the results file path."""
        self._results_file = (
            self.results_dir / f"test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        )
        return self._results_file

    def get_results_file(self):
        """Get the current results file, initializing if needed."""
        if self._results_file is None:
            self.initialize_results_file()
        return self._results_file

    def store_analysis_results(self, model: str, analysis_results: dict):
        """Store analysis results for a model.
        
        Args:
            model: Model name.
            analysis_results: Analysis results dictionary.
        """
        if model not in self._model_analysis_results:
            self._model_analysis_results[model] = analysis_results

    def add_test_result(self, test_name: str, model: str, status: str, details: str = ""):
        """Buffer a single test result.
        
        Args:
            test_name: Name of the test.
            model: Model name.
            status: Test status (PASSED or FAILED).
            details: Optional details about the test.
        """
        result_line = f"  [{status}] {test_name}"
        if details:
            result_line += f" - {details}"

        self._test_results.append((model, result_line))

    def write_all_results(self):
        """Write all buffered test results to the file at once."""
        results_file = self.get_results_file()

        # Write header
        header = f"{'='*80}\n"
        header += f"TEST RESULTS - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        header += f"{'='*80}\n\n"

        with open(results_file, "w") as f:
            f.write(header)

        # Write results grouped by model
        current_model = None
        for model, result_line in self._test_results:
            # Write model header when switching models
            if model != current_model:
                model_header = f"\n{'-'*80}\n"
                model_header += f"MODEL: {model}\n"
                model_header += f"{'-'*80}\n"

                with open(results_file, "a") as f:
                    f.write(model_header)

                # Write analysis results for this model (only once per model)
                if model in self._model_analysis_results:
                    analysis_output = f"\n--- ANALYSIS RESULTS ---\n"
                    analysis_output += json.dumps(self._model_analysis_results[model], indent=2)
                    analysis_output += "\n\n--- TEST RESULTS ---\n"

                    with open(results_file, "a") as f:
                        f.write(analysis_output)

                current_model = model

            # Write result
            with open(results_file, "a") as f:
                f.write(result_line + "\n")

        # Write summary
        total_tests = len(self._test_results)
        passed_tests = sum(1 for _, line in self._test_results if "[PASSED]" in line)

        summary = f"\n{'='*80}\n"
        summary += f"SUMMARY: {passed_tests}/{total_tests} tests passed\n"
        summary += f"{'='*80}\n"

        with open(results_file, "a") as f:
            f.write(summary)
