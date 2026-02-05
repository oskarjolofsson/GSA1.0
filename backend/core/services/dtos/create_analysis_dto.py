from dataclasses import dataclass
from uuid import UUID

@dataclass(frozen=True)
class CreateAnalysisDTO:
    start_time: float
    end_time: float
    
    user_id: UUID
    
    model: str
    
    prompt_shape: str | None = None
    prompt_height: str | None = None
    prompt_misses: str | None = None
    prompt_extra: str | None = None