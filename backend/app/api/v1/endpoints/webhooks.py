from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy.orm import Session

from app.dependencies.db import get_db
from core.services.payment import billing_service, revenuecat_service

router = APIRouter()

@router.post("/stripe/")
async def stripe(
    request: Request,
    stripe_signature: str = Header(alias="Stripe-Signature"),
    db: Session = Depends(get_db),
):
    """
    Receive Stripe subscription lifecycle events.

    Reads the raw body rather than parsed JSON because signature verification runs
    over the exact bytes Stripe signed. Always returns 200 once the signature checks
    out: unrecognized event types are recorded and ignored, and replays are dropped
    by event id, so Stripe never retries an event we have already seen.
    """
    payload = await request.body()

    await billing_service.handle_stripe_webhook(
        payload=payload,
        signature=stripe_signature,
        db_session=db,
    )

    return {"received": True}


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
    namespaced by provider before the idempotency check, since a RevenueCat id
    could otherwise collide with a Stripe one in the shared table.
    """
    payload = await request.json()

    await revenuecat_service.handle_revenuecat_webhook(
        payload=payload,
        authorization=authorization,
        db_session=db,
    )

    return {"received": True}