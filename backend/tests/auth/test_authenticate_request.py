import pytest
from core.infrastructure.auth.auth_adaptor import authenticate_request
from core.infrastructure.auth.auth_client import supabaseAuthClient
from core.infrastructure.auth.exceptions import AuthenticationError


class TestAuthenticateRequest:
    """Integration tests for authenticate_request function with real Supabase."""
    
    def test_authenticate_with_valid_bearer_token(self, test_user):
        """Test authentication with a valid bearer token from Supabase."""
        # Arrange
        access_token = test_user["access_token"]
        auth_header = f"Bearer {access_token}"
        
        # Act
        result = authenticate_request(auth_header, supabaseAuthClient)
        
        # Assert
        assert result is not None
        assert "user_id" in result
        assert "email" in result
        assert result["user_id"] == str(test_user["user_id"])
        assert result["email"] == test_user["email"]
    
    def test_authenticate_with_fake_bearer_token(self):
        """Test authentication with a fake/invalid bearer token."""
        # Arrange
        fake_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        auth_header = f"Bearer {fake_token}"
        
        # Act & Assert
        with pytest.raises(AuthenticationError) as exc_info:
            authenticate_request(auth_header, supabaseAuthClient)
        
        assert "Invalid or expired token" in str(exc_info.value)
    
    def test_authenticate_with_random_string_token(self):
        """Test authentication with a completely invalid token string."""
        # Arrange
        invalid_token = "this-is-not-a-valid-jwt-token"
        auth_header = f"Bearer {invalid_token}"
        
        # Act & Assert
        with pytest.raises(AuthenticationError) as exc_info:
            authenticate_request(auth_header, supabaseAuthClient)
        
        assert "Invalid or expired token" in str(exc_info.value)
    
    def test_authenticate_without_bearer_prefix(self, test_user):
        """Test authentication with missing 'Bearer ' prefix."""
        # Arrange
        access_token = test_user["access_token"]
        auth_header = access_token  # No "Bearer " prefix
        
        # Act & Assert
        with pytest.raises(AuthenticationError) as exc_info:
            authenticate_request(auth_header, supabaseAuthClient)
        
        assert "Invalid authorization header" in str(exc_info.value)
    
    def test_authenticate_with_empty_token(self):
        """Test authentication with empty token after Bearer prefix."""
        # Arrange
        auth_header = "Bearer "
        
        # Act & Assert
        with pytest.raises(AuthenticationError) as exc_info:
            authenticate_request(auth_header, supabaseAuthClient)
        
        assert "Invalid or expired token" in str(exc_info.value)
    
    def test_authenticate_with_whitespace_only_token(self):
        """Test authentication with whitespace-only token."""
        # Arrange
        auth_header = "Bearer    "
        
        # Act & Assert
        with pytest.raises(AuthenticationError) as exc_info:
            authenticate_request(auth_header, supabaseAuthClient)
        
        assert "Invalid or expired token" in str(exc_info.value)
    
    def test_authenticate_with_malformed_prefix(self, test_user):
        """Test authentication with incorrect bearer prefix (lowercase)."""
        # Arrange
        access_token = test_user["access_token"]
        auth_header = f"bearer {access_token}"  # lowercase
        
        # Act & Assert
        with pytest.raises(AuthenticationError) as exc_info:
            authenticate_request(auth_header, supabaseAuthClient)
        
        assert "Invalid authorization header" in str(exc_info.value)
