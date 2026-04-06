from fastapi import APIRouter, Depends


router = APIRouter()


@router.post("/checkout-session/")
def checkout_session():
    ...
    
    
@router.get("/portal/")
def portal():
    ...
    
    
@router.get("/status")
def status():
    ...