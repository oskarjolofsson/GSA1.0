from core.infrastructure.db import models
from core.services import user_service
from core.services.dtos import user_service_dto as dtos 
import pytest
from core.services import exceptions

def test_get_all_users(test_user, db_session):
    page = user_service.get_all_users(db_session, limit=1000, offset=0)
    user_ids = [user.id for user in page.items]

    assert page.total > 0
    assert page.limit == 1000
    assert page.offset == 0
    assert len(page.items) == page.total or len(page.items) == 1000
    assert test_user["user_id"] in user_ids


def test_get_all_users_pagination_mechanics(test_user, db_session):
    # limit is echoed, items never exceed it, and an offset past the end yields
    # no items but the same stable total.
    first = user_service.get_all_users(db_session, limit=1, offset=0)
    assert first.limit == 1
    assert len(first.items) <= 1

    total = first.total
    past_end = user_service.get_all_users(db_session, limit=1, offset=total)
    assert past_end.items == []
    assert past_end.total == total


def test_get_all_users_enriches_rows(test_user, db_session):
    # A returned row carries the enriched fields, not just id/name/email.
    page = user_service.get_all_users(db_session, limit=1000, offset=0)
    row = next(u for u in page.items if u.id == test_user["user_id"])
    assert row.email == test_user["email"]
    assert hasattr(row, "role")
    assert row.analyses_count is not None


def test_search_users_blank_query_returns_empty(db_session):
    assert user_service.search_users(db_session, "   ", limit=10) == []


def test_search_users_finds_by_email(test_user, db_session):
    # Email is unique per test user, so searching it returns exactly that row,
    # fully enriched (proves search reuses the same enrichment as the list).
    results = user_service.search_users(db_session, test_user["email"], limit=10)
    assert any(u.id == test_user["user_id"] for u in results)
    match = next(u for u in results if u.id == test_user["user_id"])
    assert match.analyses_count is not None


def test_search_users_respects_limit(test_user, db_session):
    results = user_service.search_users(db_session, "@", limit=3)
    assert len(results) <= 3


def test_set_user_role_flips_and_returns_enriched(test_user, db_session):
    import uuid

    caller = uuid.uuid4()  # a different id, so the self-guard doesn't trip
    target = test_user["user_id"]

    dto = user_service.set_user_role(caller, target, "admin", db_session)
    assert dto.id == target
    assert dto.role == "admin"
    assert user_service.is_admin(str(target), db_session) is True
    # analyses_count proves the response went through the enrichment path.
    assert dto.analyses_count is not None

    dto = user_service.set_user_role(caller, target, "user", db_session)
    assert user_service.is_admin(str(target), db_session) is False


def test_set_user_role_self_change_forbidden(test_user, db_session):
    uid = test_user["user_id"]
    with pytest.raises(exceptions.ForbiddenException):
        user_service.set_user_role(uid, uid, "user", db_session)


def test_set_user_role_invalid_role_raises(test_user, db_session):
    import uuid

    with pytest.raises(exceptions.ValidationException):
        user_service.set_user_role(
            uuid.uuid4(), test_user["user_id"], "superuser", db_session
        )
    

def test_is_admin_and_set_admin(test_user, db_session):
    assert user_service.is_admin(str(test_user["user_id"]), db_session) is False    # Should not be admin by default
    user_service.set_admin(str(test_user["user_id"]), True, db_session)             # Set to admin
    assert user_service.is_admin(str(test_user["user_id"]), db_session) is True     # Should now be admin
    user_service.set_admin(str(test_user["user_id"]), False, db_session)            # Revert back to non-admin
    assert user_service.is_admin(str(test_user["user_id"]), db_session) is False    # Should not be admin anymore
    
    
def test_set_admin_nonexistent_user(db_session):
    non_existent_user_id = "00000000-0000-0000-0000-000000000000"
    with pytest.raises(exceptions.NotFoundException):
        user_service.set_admin(non_existent_user_id, True, db_session)
        
    

    

