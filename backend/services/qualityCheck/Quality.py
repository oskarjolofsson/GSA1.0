from abc import ABC, abstractmethod
from typing import Any

from services.file_handeling.File import File

class Quality(ABC):
    def __init__(self, file: File):
        self.file = file

    @abstractmethod
    def validate(self) -> bool:
        """Quick yes/no check if the file meets minimum quality requirements."""

    @abstractmethod
    def issues(self) -> list[str]:
        """List of human-readable issues found (empty if none)."""

    def report(self) -> dict[str, Any]:
        """Standardized report (shared implementation)."""
        return {
            "file": str(self.file.path()),
            "valid": self.validate(),
            "issues": self.issues(),
            "metrics": self.metrics(),
        }