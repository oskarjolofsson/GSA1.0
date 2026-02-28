from uuid import UUID

from pydantic import BaseModel

class GetUserDTO(BaseModel):
    id: UUID
    name: str
    email: str
    
    role: str | None = None
    auth_provider: str | None = None
    status: str | None = None
    analyses_count: int | None = None
    drills_completed: int | None = None
    
    created_at: str
    updated_at: str