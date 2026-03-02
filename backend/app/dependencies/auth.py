from fastapi import Header, Depends
from core.infrastructure.auth.auth_adaptor import authenticate_request
from core.infrastructure.auth.auth_client import AuthClient, supabaseAuthClient
from core.services.exceptions import UnauthorizedException


def get_auth_client() -> AuthClient:
    """Factory function to provide the auth client instance."""
    return supabaseAuthClient


def get_current_user(
    authorization: str = Header(...),
    client: AuthClient = Depends(get_auth_client),
):
    decoded = authenticate_request(authorization, client)
    if not decoded:
        raise UnauthorizedException("Invalid or missing authentication token")
    return decoded
