from dataclasses import dataclass
from uuid import UUID
from datetime import datetime


@dataclass(frozen=True)
class CreateDrillDTO:
    title: str
    task: str
    success_signal: str
    fault_indicator: str


@dataclass(frozen=True)
class DrillResponseDTO:
    id: UUID
    title: str
    task: str
    success_signal: str
    fault_indicator: str
    created_at: datetime


