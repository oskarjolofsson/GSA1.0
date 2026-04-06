from fastapi import APIRouter, Depends
from fastapi import APIRouter, Request, Header, HTTPException
from core.infrastructure.payment.stripe.webhook import StripeWebhookVerifier

router = APIRouter()

router = APIRouter()
verifier = StripeWebhookVerifier()

@router.post("/stripe/")
async def stripe(
    request: Request,
    stripe_signature: str = Header(alias="Stripe-Signature"),
):
    payload = await request.body()

    try:
        event = verifier.construct_event(payload, stripe_signature)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Stripe signature")

    # send event to service layer here
    return {"received": True}