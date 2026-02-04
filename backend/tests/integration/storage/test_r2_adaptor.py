import pytest
from unittest.mock import Mock, patch, MagicMock
from backend.core.infrastructure.storage.r2Adaptor import (
    generate_upload_url,
    generate_read_url,
    get_object,
    object_exists,
    delete,
)


@pytest.fixture
def mock_r2_client():
    """Mock the r2_client module"""
    with patch("backend.core.infrastructure.storage.r2Adaptor.r2_client") as mock:
        yield mock


class TestGenerateUploadUrl:
    def test_generate_upload_url_returns_signed_url(self, mock_r2_client):
        # Arrange
        test_key = "test/video.mp4"
        expected_url = "https://r2.example.com/signed-upload-url"
        mock_r2_client.generate_signed_url.return_value = expected_url

        # Act
        result = generate_upload_url(None, test_key)

        # Assert
        assert result == expected_url
        mock_r2_client.generate_signed_url.assert_called_once_with(
            method="put_object", key=test_key, expires_in=300
        )

    def test_generate_upload_url_with_different_key(self, mock_r2_client):
        # Arrange
        test_key = "test/users/123/analysis/video.mp4"
        expected_url = "https://r2.example.com/another-signed-url"
        mock_r2_client.generate_signed_url.return_value = expected_url

        # Act
        result = generate_upload_url(None, test_key)

        # Assert
        assert result == expected_url
        mock_r2_client.generate_signed_url.assert_called_once_with(
            method="put_object", key=test_key, expires_in=300
        )


class TestGenerateReadUrl:
    def test_generate_read_url_returns_signed_url(self, mock_r2_client):
        # Arrange
        test_key = "test/video.mp4"
        expected_url = "https://r2.example.com/signed-read-url"
        mock_r2_client.generate_signed_url.return_value = expected_url

        # Act
        result = generate_read_url(None, test_key)

        # Assert
        assert result == expected_url
        mock_r2_client.generate_signed_url.assert_called_once_with(
            method="get_object", key=test_key, expires_in=3600
        )

    def test_generate_read_url_with_longer_expiry(self, mock_r2_client):
        # Arrange
        test_key = "test/public/thumbnail.jpg"
        expected_url = "https://r2.example.com/read-url-2"
        mock_r2_client.generate_signed_url.return_value = expected_url

        # Act
        result = generate_read_url(None, test_key)

        # Assert
        assert result == expected_url
        # Verify it uses 3600 seconds (1 hour) expiry
        mock_r2_client.generate_signed_url.assert_called_once_with(
            method="get_object", key=test_key, expires_in=3600
        )


class TestGetObject:
    def test_get_object_returns_bytes(self, mock_r2_client):
        # Arrange
        test_key = "test/file.bin"
        expected_data = b"binary file content"
        mock_r2_client.get_object.return_value = expected_data

        # Act
        result = get_object(None, test_key)

        # Assert
        assert result == expected_data
        assert isinstance(result, bytes)
        mock_r2_client.get_object.assert_called_once_with(test_key)

    def test_get_object_with_video_data(self, mock_r2_client):
        # Arrange
        test_key = "test/videos/swing.mp4"
        expected_data = b"\x00\x00\x00\x18ftypmp42"  # MP4 header
        mock_r2_client.get_object.return_value = expected_data

        # Act
        result = get_object(None, test_key)

        # Assert
        assert result == expected_data
        mock_r2_client.get_object.assert_called_once_with(test_key)

    def test_get_object_empty_file(self, mock_r2_client):
        # Arrange
        test_key = "test/empty.txt"
        expected_data = b""
        mock_r2_client.get_object.return_value = expected_data

        # Act
        result = get_object(None, test_key)

        # Assert
        assert result == expected_data
        assert len(result) == 0


class TestObjectExists:
    def test_object_exists_returns_true(self, mock_r2_client):
        # Arrange
        test_key = "test/existing-file.mp4"
        mock_r2_client.head_object.return_value = True

        # Act
        result = object_exists(None, test_key)

        # Assert
        assert result is True
        mock_r2_client.head_object.assert_called_once_with(test_key)

    def test_object_exists_returns_false(self, mock_r2_client):
        # Arrange
        test_key = "test/non-existing-file.mp4"
        mock_r2_client.head_object.return_value = False

        # Act
        result = object_exists(None, test_key)

        # Assert
        assert result is False
        mock_r2_client.head_object.assert_called_once_with(test_key)

    def test_object_exists_with_nested_path(self, mock_r2_client):
        # Arrange
        test_key = "test/users/123/videos/analysis/swing.mp4"
        mock_r2_client.head_object.return_value = True

        # Act
        result = object_exists(None, test_key)

        # Assert
        assert result is True
        mock_r2_client.head_object.assert_called_once_with(test_key)


class TestDelete:
    def test_delete_calls_client(self, mock_r2_client):
        # Arrange
        test_key = "test/file-to-delete.mp4"
        mock_r2_client.delete_object.return_value = None

        # Act
        result = delete(None, test_key)

        # Assert
        assert result is None
        mock_r2_client.delete_object.assert_called_once_with(test_key)

    def test_delete_multiple_files(self, mock_r2_client):
        # Arrange
        keys = ["test/file1.mp4", "test/file2.mp4", "test/file3.mp4"]
        mock_r2_client.delete_object.return_value = None

        # Act
        for key in keys:
            delete(None, key)

        # Assert
        assert mock_r2_client.delete_object.call_count == 3
        for key in keys:
            mock_r2_client.delete_object.assert_any_call(key)

    def test_delete_with_special_characters(self, mock_r2_client):
        # Arrange
        test_key = "test/users/user@example.com/videos/swing (1).mp4"
        mock_r2_client.delete_object.return_value = None

        # Act
        delete(None, test_key)

        # Assert
        mock_r2_client.delete_object.assert_called_once_with(test_key)


class TestEdgeCases:
    def test_empty_key_string(self, mock_r2_client):
        # Arrange
        test_key = "test/"
        mock_r2_client.generate_signed_url.return_value = "url"

        # Act
        result = generate_upload_url(None, test_key)

        # Assert - should still call with test/ prefix
        mock_r2_client.generate_signed_url.assert_called_once_with(
            method="put_object", key="test/", expires_in=300
        )

    def test_key_with_special_characters(self, mock_r2_client):
        # Arrange
        test_key = "test/users/user@example.com/videos/my-swing (1) [edited].mp4"
        mock_r2_client.get_object.return_value = b"data"

        # Act
        result = get_object(None, test_key)

        # Assert
        mock_r2_client.get_object.assert_called_once_with(test_key)

    def test_very_long_key(self, mock_r2_client):
        # Arrange
        test_key = "test/" + "a" * 1000  # Very long key
        mock_r2_client.head_object.return_value = True

        # Act
        result = object_exists(None, test_key)

        # Assert
        assert result is True
        mock_r2_client.head_object.assert_called_once_with(test_key)