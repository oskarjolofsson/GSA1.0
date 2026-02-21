from sqlalchemy.orm import Session
from uuid import UUID
from ..models.Prompt import Prompt


def create_prompt(prompt: Prompt, session: Session) -> Prompt:
    """Create a new prompt entry."""
    session.add(prompt)
    session.flush()
    return prompt


def get_prompt_by_analysis_id(analysis_id: UUID, session: Session) -> Prompt | None:
    """Get a prompt by analysis ID."""
    return session.query(Prompt).filter(Prompt.analysis_id == analysis_id).first()


def update_prompt(prompt: Prompt, session: Session) -> Prompt:
    """Update an existing prompt."""
    session.flush()
    return prompt


def delete_prompt(prompt: Prompt, session: Session) -> None:
    """Delete a prompt."""
    session.delete(prompt)
    session.flush()