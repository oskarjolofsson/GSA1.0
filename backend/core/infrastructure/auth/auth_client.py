
# TODO implmenet this for supabase
# TODO THen write tests for it and implment in routers
import time
import requests
from jose import jwt, JWTError
from typing import Optional

class AuthClient:
    def verify_token(self, token: str) -> Optional[dict]:
        raise NotImplementedError


class SupabaseAuthClient(AuthClient):
    """
    Verifies Supabase JWT access tokens using Supabase JWKS.
    """

    def __init__(
        self,
        project_url: str,
        jwt_audience: str = "authenticated",
        cache_ttl_seconds: int = 3600,
    ):
        self.project_url = project_url.rstrip("/")
        self.jwt_audience = jwt_audience
        self.jwks_url = f"{self.project_url}/auth/v1/keys"

        self._jwks = None
        self._jwks_expires_at = 0
        self._cache_ttl = cache_ttl_seconds

    def _get_jwks(self) -> dict:
        """
        Fetch and cache Supabase JWKS.
        """
        now = time.time()
        if self._jwks and now < self._jwks_expires_at:
            return self._jwks

        response = requests.get(self.jwks_url, timeout=5)
        response.raise_for_status()

        self._jwks = response.json()
        self._jwks_expires_at = now + self._cache_ttl
        return self._jwks

    def verify_token(self, token: str) -> Optional[dict]:
        """
        Verify Supabase JWT and return normalized claims or None.
        """
        try:
            jwks = self._get_jwks()

            payload = jwt.decode(
                token,
                jwks,
                algorithms=["RS256"],
                audience=self.jwt_audience,
                options={
                    "verify_signature": True,
                    "verify_aud": True,
                    "verify_exp": True,
                    "verify_iss": True,
                },
            )

            # Normalize claims
            return {
                "user_id": payload.get("sub"),
                "email": payload.get("email"),
                "role": payload.get("role"),
                "provider": "supabase",
                "raw": payload,
            }

        except (JWTError, KeyError):
            return None
