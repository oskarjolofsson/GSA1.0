from ....core.infrastructure.db.models.Role import Role
from ....core.infrastructure.db.repositories.roles import (
    create_role,
    get_role_by_id,
    get_role_by_name,
    get_all_roles,
    get_system_roles,
    get_paid_roles,
    update_role,
    delete_role,
)
import pytest


class TestRoleCreate:
    """Tests for creating Role records"""

    def test_create_role_with_required_fields(self, db_session):
        """Test creating a role with required fields"""
        role = Role(name="test_user")

        created = create_role(role=role, session=db_session)

        assert created.id is not None
        assert created.name == "test_user"
        assert created.description is None
        assert created.is_system is False
        assert created.is_paid is False
        assert created.created_at is not None

    def test_create_role_with_all_fields(self, db_session):
        """Test creating a role with all fields"""
        role = Role(
            name="premium_member",
            description="Premium membership with full access",
            is_system=False,
            is_paid=True,
        )

        created = create_role(role=role, session=db_session)

        assert created.id is not None
        assert created.name == "premium_member"
        assert created.description == "Premium membership with full access"
        assert created.is_system is False
        assert created.is_paid is True

    def test_create_system_role(self, db_session):
        """Test creating a system role"""
        role = Role(
            name="admin",
            description="System administrator",
            is_system=True,
        )

        created = create_role(role=role, session=db_session)

        assert created.is_system is True

    def test_create_role_persists_to_database(self, db_session):
        """Test that created role is persisted to database"""
        role = Role(name="editor")

        create_role(role=role, session=db_session)

        fetched = get_role_by_id(role.id, session=db_session)

        assert fetched is not None
        assert fetched.id == role.id
        assert fetched.name == "editor"


class TestRoleRead:
    """Tests for reading Role records"""

    def test_get_role_by_id(self, db_session):
        """Test retrieving a role by ID"""
        role = Role(name="viewer")
        created = create_role(role=role, session=db_session)

        fetched = get_role_by_id(created.id, session=db_session)

        assert fetched is not None
        assert fetched.id == created.id
        assert fetched.name == "viewer"

    def test_get_role_by_id_not_found(self, db_session):
        """Test retrieving a non-existent role returns None"""
        result = get_role_by_id(99999, session=db_session)

        assert result is None

    def test_get_role_by_name(self, db_session):
        """Test retrieving a role by name"""
        role = Role(name="moderator")
        create_role(role=role, session=db_session)

        fetched = get_role_by_name("moderator", session=db_session)

        assert fetched is not None
        assert fetched.name == "moderator"

    def test_get_role_by_name_not_found(self, db_session):
        """Test retrieving a non-existent role by name returns None"""
        result = get_role_by_name("nonexistent_role", session=db_session)

        assert result is None

    def test_get_all_roles(self, db_session):
        """Test retrieving all roles"""
        role1 = Role(name="role_one")
        role2 = Role(name="role_two")
        create_role(role=role1, session=db_session)
        create_role(role=role2, session=db_session)

        roles = get_all_roles(session=db_session)

        role_names = [r.name for r in roles]
        assert "role_one" in role_names
        assert "role_two" in role_names

    def test_get_system_roles(self, db_session):
        """Test retrieving only system roles"""
        system_role = Role(name="sys_admin", is_system=True)
        regular_role = Role(name="regular_user", is_system=False)
        create_role(role=system_role, session=db_session)
        create_role(role=regular_role, session=db_session)

        system_roles = get_system_roles(session=db_session)

        role_names = [r.name for r in system_roles]
        assert "sys_admin" in role_names
        assert "regular_user" not in role_names

    def test_get_paid_roles(self, db_session):
        """Test retrieving only paid roles"""
        paid_role = Role(name="premium", is_paid=True)
        free_role = Role(name="free_tier", is_paid=False)
        create_role(role=paid_role, session=db_session)
        create_role(role=free_role, session=db_session)

        paid_roles = get_paid_roles(session=db_session)

        role_names = [r.name for r in paid_roles]
        assert "premium" in role_names
        assert "free_tier" not in role_names


class TestRoleUpdate:
    """Tests for updating Role records"""

    def test_update_role_name(self, db_session):
        """Test updating a role name"""
        role = Role(name="old_name")
        create_role(role=role, session=db_session)

        role.name = "new_name"
        update_role(role=role, session=db_session)

        fetched = get_role_by_id(role.id, session=db_session)
        assert fetched.name == "new_name"

    def test_update_role_description(self, db_session):
        """Test updating a role description"""
        role = Role(name="updatable_role")
        create_role(role=role, session=db_session)

        role.description = "Updated description"
        update_role(role=role, session=db_session)

        fetched = get_role_by_id(role.id, session=db_session)
        assert fetched.description == "Updated description"


class TestRoleDelete:
    """Tests for deleting Role records"""

    def test_delete_role(self, db_session):
        """Test deleting a role"""
        role = Role(name="deletable_role")
        create_role(role=role, session=db_session)
        role_id = role.id

        delete_role(role=role, session=db_session)

        fetched = get_role_by_id(role_id, session=db_session)
        assert fetched is None


class TestRoleConstraints:
    """Tests for Role model constraints"""

    def test_role_id_is_integer(self, db_session):
        """Test that role ID is an integer"""
        role = Role(name="int_test_role")
        created = create_role(role=role, session=db_session)

        assert isinstance(created.id, int)

    def test_role_created_at_is_set(self, db_session):
        """Test that created_at is automatically set"""
        role = Role(name="timestamp_test_role")
        created = create_role(role=role, session=db_session)

        assert created.created_at is not None

    def test_role_name_unique(self, db_session):
        """Test that role names must be unique"""
        role1 = Role(name="unique_role")
        create_role(role=role1, session=db_session)

        role2 = Role(name="unique_role")
        with pytest.raises(Exception):
            create_role(role=role2, session=db_session)
