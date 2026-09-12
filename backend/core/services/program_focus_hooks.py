"""Thin, import-safe wrappers around Lane B's focus-deactivation hooks.

`deactivate_extra_focuses` and `reactivate_on_resub` are owned by Lane B
(program_service.py, in a parallel worktree for the subscription-model rework).
This module tries to import the real implementations and falls back to no-ops so
Lane A's webhook/lazy-check call sites and tests can be developed and run in
isolation before the two lanes are merged.

Expected signatures (per the shared spec both lanes are implementing against):
    deactivate_extra_focuses(user_id: UUID, db_session: Session, trigger: str) -> None
    reactivate_on_resub(user_id: UUID, db_session: Session) -> None

TODO: Lane B provides the real implementations in core.services.program_service.
Once merged, this module should keep working unchanged (it just forwards), but it
can also be deleted and call sites pointed straight at program_service if preferred.
"""

from uuid import UUID
from sqlalchemy.orm import Session

try:
    from core.services.program_service import (  # type: ignore[attr-defined]
        deactivate_extra_focuses as _deactivate_extra_focuses,
        reactivate_on_resub as _reactivate_on_resub,
    )
except ImportError:  # pragma: no cover - exercised until Lane B lands their functions
    def _deactivate_extra_focuses(user_id: UUID, db_session: Session, trigger: str) -> None:
        # TODO: Lane B provides this (core.services.program_service.deactivate_extra_focuses)
        return None

    def _reactivate_on_resub(user_id: UUID, db_session: Session) -> None:
        # TODO: Lane B provides this (core.services.program_service.reactivate_on_resub)
        return None


def deactivate_extra_focuses(user_id: UUID, db_session: Session, trigger: str) -> None:
    _deactivate_extra_focuses(user_id, db_session, trigger)


def reactivate_on_resub(user_id: UUID, db_session: Session) -> None:
    _reactivate_on_resub(user_id, db_session)
