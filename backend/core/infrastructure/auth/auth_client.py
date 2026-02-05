
# TODO implmenet this for supabase, for firebase, depending on what we decide to use
# TODO THen write tests for it and implment in routers
class AuthClient:
    
    def verify_token(self, token: str) -> dict | None:
        # Placeholder implementation for token verification
        # In a real implementation, this would check the token against a database or an external service
        return None