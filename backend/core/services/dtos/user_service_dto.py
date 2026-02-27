from uuid import UUID

from pydantic import BaseModel

class GetUserDTO(BaseModel):
    id: UUID
    name: str
    email: str
    created_at: str
    updated_at: str