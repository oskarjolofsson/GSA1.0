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
class UpdateDrillDTO:
    title: str | None = None
    task: str | None = None
    success_signal: str | None = None
    fault_indicator: str | None = None


@dataclass(frozen=True)
class DrillResponseDTO:
    id: UUID
    title: str
    task: str
    success_signal: str
    fault_indicator: str
    created_at: datetime
    # Which part of the game this trains (NULL = any), and how it is scored
    # (NULL = feel-only). The client branches its rating UI on `metric`.
    area: str | None = None
    metric: dict | None = None


