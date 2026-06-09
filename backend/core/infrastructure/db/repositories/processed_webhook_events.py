from sqlalchemy import select
from sqlalchemy.orm import Session

from core.infrastructure.db import models


def exists(event_id: str, session: Session) -> bool:
    stmt = select(models.ProcessedWebhookEvent.event_id).where(
        models.ProcessedWebhookEvent.event_id == event_id
    )
    return session.scalar(stmt) is not None


def mark_processed(event_id: str, event_type: str, session: Session) -> None:
    session.add(
        models.ProcessedWebhookEvent(event_id=event_id, event_type=event_type)
    )
    session.flush()
