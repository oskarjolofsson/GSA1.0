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



# def require_auth(f):
#     @wraps(f)
#     def decorated(*args, **kwargs):
#         try:
#             user = authenticate_request(
#                 request.headers.get("Authorization", ""),
#                 auth_client,
#             )
#         except AuthenticationError as e:
#             return jsonify({"error": str(e)}), 401

#         request.user = user
#         return f(*args, **kwargs)

#     return decorated

# This to be in the app/auth.py, or similar depending on routing framework