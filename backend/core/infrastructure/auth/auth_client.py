# TODO implmenet this for supabase
# TODO THen write tests for it and implment in routers
import time
import requests
from jose import jwt, JWTError
from typing import Optional
from core.config import SUPABASE_URL, SUPABASE_ANON_KEY

class AuthClient:
    def verify_token(self, token: str) -> Optional[dict]:
        raise NotImplementedError


class SupabaseAuthClient(AuthClient):
    def __init__(self, jwt_audience="authenticated", cache_ttl=3600):
        self.project_url = SUPABASE_URL.rstrip("/")
        self.jwks_url = f"{self.project_url}/auth/v1/.well-known/jwks.json"
        self.jwt_audience = jwt_audience
        self.jwt_secret = SUPABASE_ANON_KEY
        self._jwks = None
        self._expires = 0
        self._ttl = cache_ttl

    def _get_jwks(self):
        if self._jwks and time.time() < self._expires:
            return self._jwks

        resp = requests.get(
            self.jwks_url,
            headers={"apikey": self.jwt_secret}
        )
        resp.raise_for_status()

        self._jwks = resp.json()["keys"]
        self._expires = time.time() + self._ttl
        return self._jwks

    def _get_public_key(self, token):
        try:
            unverified = jwt.get_unverified_header(token)
            kid = unverified.get("kid")
            
            if not kid:
                return None

            for key in self._get_jwks():
                if key["kid"] == kid:
                    return key

            return None
        except Exception:
            return None

    def verify_token(self, token):
        try:
            key = self._get_public_key(token)
            
            if not key:
                return None

            payload = jwt.decode(
                token,
                key,
                algorithms=["RS256", "ES256"],  # Support both algorithms
                audience=self.jwt_audience,
                options={"verify_exp": True},
            )

            return {
                "user_id": payload["sub"],
                "email": payload.get("email"),
                "role": payload.get("role"),
                "raw": payload,
            }

        except (JWTError, Exception):
            return None

supabaseAuthClient = SupabaseAuthClient()