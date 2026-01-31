# db/consent.py
from .client import supabase

def grant_consent(
    user_id: str,
    mandatory_consent_id: str,
    granted: bool,
    ip_address: str | None,
    user_agent: str | None,
):
    return (
        supabase
        .table("user_consent")
        .insert({
            "user_id": user_id,
            "mandatory_consent_id": mandatory_consent_id,
            "granted": granted,
            "ip_address": ip_address,
            "user_agent": user_agent,
        })
        .execute()
    )
