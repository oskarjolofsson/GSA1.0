from ....core.infrastructure.db.models.Permission import Permission
from ....core.infrastructure.db.repositories.permissions import (
    create_permission,
    get_permission_by_id,
    get_permission_by_name,
    get_all_permissions,
    get_permissions_by_ids,
    update_permission,
    delete_permission,
)
import pytest


class TestPermissionCreate:
    """Tests for creating Permission records"""

    def test_create_permission_with_required_fields(self, db_session):
        """Test creating a permission with required fields"""
        permission = Permission(name="read:analysis")

        created = create_permission(permission=permission, session=db_session)

        assert created.id is not None
        assert created.name == "read:analysis"
        assert created.description is None

    def test_create_permission_with_all_fields(self, db_session):
        """Test creating a permission with all fields"""
        permission = Permission(
            name="write:analysis",
            description="Allows creating and updating analyses",
        )

        created = create_permission(permission=permission, session=db_session)

        assert created.id is not None
        assert created.name == "write:analysis"
        assert created.description == "Allows creating and updating analyses"

    def test_create_permission_persists_to_database(self, db_session):
        """Test that created permission is persisted to database"""
        permission = Permission(name="delete:analysis")

        create_permission(permission=permission, session=db_session)

        fetched = get_permission_by_id(permission.id, session=db_session)

        assert fetched is not None
        assert fetched.id == permission.id
        assert fetched.name == "delete:analysis"


class TestPermissionRead:
    """Tests for reading Permission records"""

    def test_get_permission_by_id(self, db_session):
        """Test retrieving a permission by ID"""
        permission = Permission(name="read:videos")
        created = create_permission(permission=permission, session=db_session)

        fetched = get_permission_by_id(created.id, session=db_session)

        assert fetched is not None
        assert fetched.id == created.id
        assert fetched.name == "read:videos"

    def test_get_permission_by_id_not_found(self, db_session):
        """Test retrieving a non-existent permission returns None"""
        result = get_permission_by_id(99999, session=db_session)

        assert result is None

    def test_get_permission_by_name(self, db_session):
        """Test retrieving a permission by name"""
        permission = Permission(name="write:videos")
        create_permission(permission=permission, session=db_session)

        fetched = get_permission_by_name("write:videos", session=db_session)

        assert fetched is not None
        assert fetched.name == "write:videos"

    def test_get_permission_by_name_not_found(self, db_session):
        """Test retrieving a non-existent permission by name returns None"""
        result = get_permission_by_name("nonexistent_permission", session=db_session)

        assert result is None

    def test_get_all_permissions(self, db_session):
        """Test retrieving all permissions"""
        perm1 = Permission(name="perm_one")
        perm2 = Permission(name="perm_two")
        create_permission(permission=perm1, session=db_session)
        create_permission(permission=perm2, session=db_session)

        permissions = get_all_permissions(session=db_session)

        perm_names = [p.name for p in permissions]
        assert "perm_one" in perm_names
        assert "perm_two" in perm_names

    def test_get_permissions_by_ids(self, db_session):
        """Test retrieving permissions by list of IDs"""
        perm1 = Permission(name="batch_perm_one")
        perm2 = Permission(name="batch_perm_two")
        perm3 = Permission(name="batch_perm_three")
        create_permission(permission=perm1, session=db_session)
        create_permission(permission=perm2, session=db_session)
        create_permission(permission=perm3, session=db_session)

        fetched = get_permissions_by_ids([perm1.id, perm3.id], session=db_session)

        assert len(fetched) == 2
        fetched_names = [p.name for p in fetched]
        assert "batch_perm_one" in fetched_names
        assert "batch_perm_three" in fetched_names
        assert "batch_perm_two" not in fetched_names


class TestPermissionUpdate:
    """Tests for updating Permission records"""

    def test_update_permission_name(self, db_session):
        """Test updating a permission name"""
        permission = Permission(name="old_perm_name")
        create_permission(permission=permission, session=db_session)

        permission.name = "new_perm_name"
        update_permission(permission=permission, session=db_session)

        fetched = get_permission_by_id(permission.id, session=db_session)
        assert fetched.name == "new_perm_name"

    def test_update_permission_description(self, db_session):
        """Test updating a permission description"""
        permission = Permission(name="updatable_perm")
        create_permission(permission=permission, session=db_session)

        permission.description = "Updated description"
        update_permission(permission=permission, session=db_session)

        fetched = get_permission_by_id(permission.id, session=db_session)
        assert fetched.description == "Updated description"


class TestPermissionDelete:
    """Tests for deleting Permission records"""

    def test_delete_permission(self, db_session):
        """Test deleting a permission"""
        permission = Permission(name="deletable_perm")
        create_permission(permission=permission, session=db_session)
        perm_id = permission.id

        delete_permission(permission=permission, session=db_session)

        fetched = get_permission_by_id(perm_id, session=db_session)
        assert fetched is None


class TestPermissionConstraints:
    """Tests for Permission model constraints"""

    def test_permission_id_is_integer(self, db_session):
        """Test that permission ID is an integer"""
        permission = Permission(name="int_test_perm")
        created = create_permission(permission=permission, session=db_session)

        assert isinstance(created.id, int)

    def test_permission_name_unique(self, db_session):
        """Test that permission names must be unique"""
        perm1 = Permission(name="unique_perm")
        create_permission(permission=perm1, session=db_session)

        perm2 = Permission(name="unique_perm")
        with pytest.raises(Exception):
            create_permission(permission=perm2, session=db_session)
