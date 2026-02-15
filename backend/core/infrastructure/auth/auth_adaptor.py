from .exceptions import AuthenticationError
from .auth_client import AuthClient

def authenticate_request(auth_header: str, client: AuthClient) -> dict:
    if not auth_header.startswith("Bearer "):
        raise AuthenticationError("Invalid authorization header")

    token = auth_header.removeprefix("Bearer ").strip()
    decoded = client.verify_token(token)

    if not decoded:
        raise AuthenticationError("Invalid or expired token")

    return decoded