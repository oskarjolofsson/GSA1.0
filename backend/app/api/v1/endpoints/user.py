from fastapi import APIRouter, Depends
from app.dependencies.auth import get_current_user
from core.services.user_service import get_user_by_id, get_all_users as service_get_all_users
from app.dependencies.db import get_db
from sqlalchemy.orm import Session
from app.api.v1.schemas.user import GetUser

router = APIRouter()


@router.post("/profile")
def register_or_update_profile():
    """
    Register or update user profile information.

    Arguments (JSON body):
        name (str): User's name
        email (str): User's email address
    Returns:
        JSON response with success status
    """
    pass


@router.post("/consent")
def set_user_consent():
    """
    Set user consent status.

    Arguments (JSON body):
        consent (bool): Consent status

    Returns:
        JSON response with success status
    """
    pass


@router.get("/consent")
def get_user_consent():
    """
    Get user consent status.

    Returns:
        JSON response with consent status
    """
    pass


# ADMIN ONLY
@router.get("/all")
def get_all_users(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    print("Getting all users - ADMIN ONLY")
    users = service_get_all_users(db)
    return [GetUser.from_domain(user) for user in users]
    

