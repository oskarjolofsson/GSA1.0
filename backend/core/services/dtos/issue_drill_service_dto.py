from dataclasses import dataclass
from uuid import UUID
from datetime import datetime


@dataclass(frozen=True)
class CreateIssueDrillDTO:
    issue_id: UUID
    drill_id: UUID


@dataclass(frozen=True)
class IssueDrillResponseDTO:
    id: UUID
    issue_id: UUID
    drill_id: UUID
    created_at: datetime
