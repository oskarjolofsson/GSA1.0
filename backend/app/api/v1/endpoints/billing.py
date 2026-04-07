from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from core.services.payment import billing_service
from uuid import UUID


router = APIRouter()


@router.post("/checkout-session/")
async def checkout_session(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    checkout_url = await billing_service.start_subscription_checkout(
        user_id=UUID(current_user["user_id"]),
        db_session=db,
    )
    return {"checkout_url": checkout_url}
    
    
@router.get("/portal/")
async def portal(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    portal_url = await billing_service.create_customer_portal(
        user_id=UUID(current_user["user_id"]),
        db_session=db,
    )
    return {"portal_url": portal_url}
    
    
@router.get("/status")
def status():
    return {"status": "not_implemented"}