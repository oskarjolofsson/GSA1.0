from core.infrastructure.db import models
from core.services import user_service
from core.services.dtos import user_service_dto as dtos 
import pytest
from core.services import exceptions

def test_get_all_users(test_user, db_session):
    users: list[dtos.GetUserDTO] = user_service.get_all_users(db_session)
    user_ids = [user.id for user in users]
    
    assert len(users) > 0
    assert test_user["user_id"] in user_ids    
    

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
        
    

    

