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
    payload = await request.json()

    await revenuecat_service.handle_revenuecat_webhook(
        payload=payload,
        authorization=authorization,
        db_session=db,
    )

    return {"received": True}