from ....core.infrastructure.db.models.RolePermission import RolePermission
from ....core.infrastructure.db.models.Role import Role
from ....core.infrastructure.db.models.Permission import Permission
from ....core.infrastructure.db.repositories.role_permissions import (
    get_role_permission,
    get_permissions_by_role_id,
    get_role_permissions_by_role_id,
    role_has_permission,
    assign_permission_to_role,
    assign_permissions_to_role,
    remove_permission_from_role,
    remove_all_permissions_from_role,
)
from ....core.infrastructure.db.repositories.roles import create_role
from ....core.infrastructure.db.repositories.permissions import create_permission
import pytest
import uuid


@pytest.fixture
def test_role(db_session):
    """Create a role for testing"""
    role = Role(name=f"test_role_{uuid.uuid4().hex[:8]}")
    return create_role(role=role, session=db_session)


@pytest.fixture
def test_permission_read(db_session):
    """Create a read permission for testing"""
    permission = Permission(name=f"read_{uuid.uuid4().hex[:8]}")
    return create_permission(permission=permission, session=db_session)


@pytest.fixture
def test_permission_write(db_session):
    """Create a write permission for testing"""
    permission = Permission(name=f"write_{uuid.uuid4().hex[:8]}")
    return create_permission(permission=permission, session=db_session)


@pytest.fixture
def test_permission_delete(db_session):
    """Create a delete permission for testing"""
    permission = Permission(name=f"delete_{uuid.uuid4().hex[:8]}")
    return create_permission(permission=permission, session=db_session)


class TestRolePermissionAssign:
    """Tests for assigning permissions to roles"""

    def test_assign_permission_to_role(self, db_session, test_role, test_permission_read):
        """Test assigning a permission to a role"""
        role_permission = RolePermission(
            role_id=test_role.id,
            permission_id=test_permission_read.id,
        )

        created = assign_permission_to_role(role_permission=role_permission, session=db_session)

        assert created.role_id == test_role.id
        assert created.permission_id == test_permission_read.id

    def test_assign_multiple_permissions_to_role(self, db_session, test_role, test_permission_read, test_permission_write):
        """Test assigning multiple permissions to a role one at a time"""
        rp1 = RolePermission(role_id=test_role.id, permission_id=test_permission_read.id)
        rp2 = RolePermission(role_id=test_role.id, permission_id=test_permission_write.id)

        assign_permission_to_role(role_permission=rp1, session=db_session)
        assign_permission_to_role(role_permission=rp2, session=db_session)

        permissions = get_permissions_by_role_id(test_role.id, session=db_session)

        assert len(permissions) == 2

    def test_assign_permissions_to_role_bulk(self, db_session, test_role, test_permission_read, test_permission_write, test_permission_delete):
        """Test bulk assigning permissions to a role"""
        permission_ids = [test_permission_read.id, test_permission_write.id, test_permission_delete.id]

        role_permissions = assign_permissions_to_role(test_role.id, permission_ids, session=db_session)

        assert len(role_permissions) == 3
        permissions = get_permissions_by_role_id(test_role.id, session=db_session)
        assert len(permissions) == 3


class TestRolePermissionRead:
    """Tests for reading role permission records"""

    def test_get_role_permission(self, db_session, test_role, test_permission_read):
        """Test retrieving a specific role-permission assignment"""
        rp = RolePermission(role_id=test_role.id, permission_id=test_permission_read.id)
        assign_permission_to_role(role_permission=rp, session=db_session)

        fetched = get_role_permission(test_role.id, test_permission_read.id, session=db_session)

        assert fetched is not None
        assert fetched.role_id == test_role.id
        assert fetched.permission_id == test_permission_read.id

    def test_get_role_permission_not_found(self, db_session, test_role, test_permission_read):
        """Test retrieving non-existent role-permission returns None"""
        result = get_role_permission(test_role.id, test_permission_read.id, session=db_session)

        assert result is None

    def test_get_permissions_by_role_id(self, db_session, test_role, test_permission_read, test_permission_write):
        """Test retrieving all permissions for a role"""
        rp1 = RolePermission(role_id=test_role.id, permission_id=test_permission_read.id)
        rp2 = RolePermission(role_id=test_role.id, permission_id=test_permission_write.id)
        assign_permission_to_role(role_permission=rp1, session=db_session)
        assign_permission_to_role(role_permission=rp2, session=db_session)

        permissions = get_permissions_by_role_id(test_role.id, session=db_session)

        assert len(permissions) == 2
        perm_ids = [p.id for p in permissions]
        assert test_permission_read.id in perm_ids
        assert test_permission_write.id in perm_ids

    def test_get_role_permissions_by_role_id(self, db_session, test_role, test_permission_read):
        """Test retrieving RolePermission records for a role"""
        rp = RolePermission(role_id=test_role.id, permission_id=test_permission_read.id)
        assign_permission_to_role(role_permission=rp, session=db_session)

        role_permissions = get_role_permissions_by_role_id(test_role.id, session=db_session)

        assert len(role_permissions) == 1
        assert role_permissions[0].role_id == test_role.id
        assert role_permissions[0].permission_id == test_permission_read.id

    def test_role_has_permission_true(self, db_session, test_role, test_permission_read):
        """Test checking if role has a specific permission - positive case"""
        rp = RolePermission(role_id=test_role.id, permission_id=test_permission_read.id)
        assign_permission_to_role(role_permission=rp, session=db_session)

        result = role_has_permission(test_role.id, test_permission_read.name, session=db_session)

        assert result is True

    def test_role_has_permission_false(self, db_session, test_role, test_permission_read):
        """Test checking if role has a specific permission - negative case"""
        result = role_has_permission(test_role.id, test_permission_read.name, session=db_session)

        assert result is False


class TestRolePermissionRemove:
    """Tests for removing permissions from roles"""

    def test_remove_permission_from_role(self, db_session, test_role, test_permission_read):
        """Test removing a permission from a role"""
        rp = RolePermission(role_id=test_role.id, permission_id=test_permission_read.id)
        assign_permission_to_role(role_permission=rp, session=db_session)

        remove_permission_from_role(test_role.id, test_permission_read.id, session=db_session)

        fetched = get_role_permission(test_role.id, test_permission_read.id, session=db_session)
        assert fetched is None

    def test_remove_nonexistent_permission_from_role(self, db_session, test_role, test_permission_read):
        """Test removing a permission that role doesn't have (should not error)"""
        # Should not raise an exception
        remove_permission_from_role(test_role.id, test_permission_read.id, session=db_session)

    def test_remove_all_permissions_from_role(self, db_session, test_role, test_permission_read, test_permission_write):
        """Test removing all permissions from a role"""
        rp1 = RolePermission(role_id=test_role.id, permission_id=test_permission_read.id)
        rp2 = RolePermission(role_id=test_role.id, permission_id=test_permission_write.id)
        assign_permission_to_role(role_permission=rp1, session=db_session)
        assign_permission_to_role(role_permission=rp2, session=db_session)

        remove_all_permissions_from_role(test_role.id, session=db_session)

        permissions = get_permissions_by_role_id(test_role.id, session=db_session)
        assert len(permissions) == 0


class TestRolePermissionConstraints:
    """Tests for RolePermission model constraints"""

    def test_role_permission_composite_primary_key(self, db_session, test_role, test_permission_read):
        """Test that role-permission combination is unique"""
        rp1 = RolePermission(role_id=test_role.id, permission_id=test_permission_read.id)
        assign_permission_to_role(role_permission=rp1, session=db_session)

        rp2 = RolePermission(role_id=test_role.id, permission_id=test_permission_read.id)
        with pytest.raises(Exception):
            assign_permission_to_role(role_permission=rp2, session=db_session)
