# db/profiles.py
from .client import supabase

def get_profile(user_id: str):
    return (
        supabase
        .table("profiles")
        .select("*")
        .eq("id", user_id)
        .single()
        .execute()
    )

def create_profile(user_id: str, name: str, email: str):
    return (
        supabase
        .table("profiles")
        .insert({
            "id": user_id,
            "name": name,
            "email": email,
        })
        .execute()
    )

def update_profile(user_id: str, name: str):
    return (
        supabase
        .table("profiles")
        .update({"name": name})
        .eq("id", user_id)
        .execute()
    )
