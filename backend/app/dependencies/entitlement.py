from uuid import UUID

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from core.services.payment import entitlement_service
from core.services.exceptions import FocusLimitExceeded
from core.infrastructure.db.repositories import programs as programs_repo


def require_ai_access(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Gate for AI-powered endpoints (analysis create/run, structure-feedback).

    There is no free tier anymore: an AI call always requires a paid subscription.
    """
    user_id = UUID(current_user["user_id"])
    if not entitlement_service.is_subscribed(user_id, db):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Subscription required",
        )
    return current_user


def require_focus_capacity(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Gate for creating a new Program (focus).

    A subscribed user always has capacity. An unsubscribed user may hold at most one
    active Program at a time.

    This is a fast-fail, router-level pre-check only (no transaction/lock) meant to
    give a quick 402 to the common case. The AUTHORITATIVE enforcement is
    program_service.generate_program's row-locked check — this dependency exists so
    an obviously-over-limit request never reaches the service layer, not to replace
    it.
    """
    user_id = UUID(current_user["user_id"])
    if entitlement_service.is_subscribed(user_id, db):
        return current_user

    active_programs = programs_repo.get_active_programs_by_user(user_id, db)
    if len(active_programs) >= 1:
        raise FocusLimitExceeded()

    return current_user
