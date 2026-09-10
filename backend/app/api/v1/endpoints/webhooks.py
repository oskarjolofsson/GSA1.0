from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy.orm import Session

from app.dependencies.db import get_db
from core.services.payment import revenuecat_service

router = APIRouter()


@router.post("/revenuecat/")
async def revenuecat(
    request: Request,
    authorization: str | None = Header(default=None, alias="Authorization"),
    db: Session = Depends(get_db),
):
    """
    Receive RevenueCat subscription lifecycle events for mobile purchases.

    RevenueCat delivers both SANDBOX and PRODUCTION events to every configured
    webhook, so sandbox test purchases arrive here too; events from the other
    environment are recorded as processed and otherwise ignored. Event ids are
    namespaced by provider before the idempotency check, so a provider's id can
    never collide with another's in the shared table.
    """
    payload = await request.json()

    await revenuecat_service.handle_revenuecat_webhook(
        payload=payload,
        authorization=authorization,
        db_session=db,
    )

    return {"received": True}
