from ....core.infrastructure.db.models.UserRole import UserRole
from ....core.infrastructure.db.models.Role import Role
from ....core.infrastructure.db.repositories.user_roles import (
    get_user_role,
    get_roles_by_user_id,
    get_user_roles_by_user_id,
    get_users_by_role_id,
    user_has_role,
    assign_role_to_user,
    remove_role_from_user,
    remove_all_roles_from_user,
)
from ....core.infrastructure.db.repositories.roles import create_role
import pytest
import uuid


@pytest.fixture
def test_role(db_session):
    """Create a role for testing"""
    role = Role(name=f"test_role_{uuid.uuid4().hex[:8]}")
    return create_role(role=role, session=db_session)


@pytest.fixture
def test_role_admin(db_session):
    """Create an admin role for testing"""
    role = Role(name=f"admin_{uuid.uuid4().hex[:8]}", is_system=True)
    return create_role(role=role, session=db_session)


class TestUserRoleAssign:
    """Tests for assigning roles to users"""

    def test_assign_role_to_user(self, db_session, test_user, test_role):
        """Test assigning a role to a user"""
        user_role = UserRole(
            user_id=test_user,
            role_id=test_role.id,
        )

        created = assign_role_to_user(user_role=user_role, session=db_session)

        assert created.user_id == test_user
        assert created.role_id == test_role.id
        

    def test_assign_multiple_roles_to_user(self, db_session, test_user, test_role, test_role_admin):
        """Test assigning multiple roles to a user"""
        user_role1 = UserRole(user_id=test_user, role_id=test_role.id)
        user_role2 = UserRole(user_id=test_user, role_id=test_role_admin.id)

        assign_role_to_user(user_role=user_role1, session=db_session)
        assign_role_to_user(user_role=user_role2, session=db_session)

        roles = get_roles_by_user_id(test_user, session=db_session)

        assert len(roles) == 2


class TestUserRoleRead:
    """Tests for reading user role records"""

    def test_get_user_role(self, db_session, test_user, test_role):
        """Test retrieving a specific user-role assignment"""
        user_role = UserRole(user_id=test_user, role_id=test_role.id)
        assign_role_to_user(user_role=user_role, session=db_session)

        fetched = get_user_role(test_user, test_role.id, session=db_session)

        assert fetched is not None
        assert fetched.user_id == test_user
        assert fetched.role_id == test_role.id

    def test_get_user_role_not_found(self, db_session, test_user, test_role):
        """Test retrieving non-existent user-role returns None"""
        result = get_user_role(test_user, test_role.id, session=db_session)

        assert result is None

    def test_get_roles_by_user_id(self, db_session, test_user, test_role, test_role_admin):
        """Test retrieving all roles for a user"""
        user_role1 = UserRole(user_id=test_user, role_id=test_role.id)
        user_role2 = UserRole(user_id=test_user, role_id=test_role_admin.id)
        assign_role_to_user(user_role=user_role1, session=db_session)
        assign_role_to_user(user_role=user_role2, session=db_session)

        roles = get_roles_by_user_id(test_user, session=db_session)

        assert len(roles) == 2
        role_ids = [r.id for r in roles]
        assert test_role.id in role_ids
        assert test_role_admin.id in role_ids

    def test_get_user_roles_by_user_id(self, db_session, test_user, test_role):
        """Test retrieving UserRole records for a user"""
        user_role = UserRole(user_id=test_user, role_id=test_role.id)
        assign_role_to_user(user_role=user_role, session=db_session)

        user_roles = get_user_roles_by_user_id(test_user, session=db_session)

        assert len(user_roles) == 1
        assert user_roles[0].user_id == test_user
        assert user_roles[0].role_id == test_role.id

    def test_get_users_by_role_id(self, db_session, test_user, test_role):
        """Test retrieving all users with a specific role"""
        user_role = UserRole(user_id=test_user, role_id=test_role.id)
        assign_role_to_user(user_role=user_role, session=db_session)

        users = get_users_by_role_id(test_role.id, session=db_session)

        assert test_user in users

    def test_user_has_role_true(self, db_session, test_user, test_role):
        """Test checking if user has a specific role - positive case"""
        user_role = UserRole(user_id=test_user, role_id=test_role.id)
        assign_role_to_user(user_role=user_role, session=db_session)

        result = user_has_role(test_user, test_role.name, session=db_session)

        assert result is True

    def test_user_has_role_false(self, db_session, test_user, test_role):
        """Test checking if user has a specific role - negative case"""
        result = user_has_role(test_user, test_role.name, session=db_session)

        assert result is False


class TestUserRoleRemove:
    """Tests for removing roles from users"""

    def test_remove_role_from_user(self, db_session, test_user, test_role):
        """Test removing a role from a user"""
        user_role = UserRole(user_id=test_user, role_id=test_role.id)
        assign_role_to_user(user_role=user_role, session=db_session)

        remove_role_from_user(test_user, test_role.id, session=db_session)

        fetched = get_user_role(test_user, test_role.id, session=db_session)
        assert fetched is None

    def test_remove_nonexistent_role_from_user(self, db_session, test_user, test_role):
        """Test removing a role that user doesn't have (should not error)"""
        # Should not raise an exception
        remove_role_from_user(test_user, test_role.id, session=db_session)

    def test_remove_all_roles_from_user(self, db_session, test_user, test_role, test_role_admin):
        """Test removing all roles from a user"""
        user_role1 = UserRole(user_id=test_user, role_id=test_role.id)
        user_role2 = UserRole(user_id=test_user, role_id=test_role_admin.id)
        assign_role_to_user(user_role=user_role1, session=db_session)
        assign_role_to_user(user_role=user_role2, session=db_session)

        remove_all_roles_from_user(test_user, session=db_session)

        roles = get_roles_by_user_id(test_user, session=db_session)
        assert len(roles) == 0


class TestUserRoleConstraints:
    """Tests for UserRole model constraints"""

    def test_user_role_composite_primary_key(self, db_session, test_user, test_role):
        """Test that user-role combination is unique"""
        user_role1 = UserRole(user_id=test_user, role_id=test_role.id)
        assign_role_to_user(user_role=user_role1, session=db_session)

        user_role2 = UserRole(user_id=test_user, role_id=test_role.id)
        with pytest.raises(Exception):
            assign_role_to_user(user_role=user_role2, session=db_session)

