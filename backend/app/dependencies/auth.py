from fastapi import Header, Depends
from core.infrastructure.auth.auth_adaptor import authenticate_request
from core.infrastructure.auth.auth_client import AuthClient, supabaseAuthClient


def get_current_user(
    authorization: str = Header(...),
    client: AuthClient = Depends(supabaseAuthClient),
):
    decoded = authenticate_request(authorization, client)
    return decoded
