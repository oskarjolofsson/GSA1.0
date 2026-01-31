# db/analysis.py
from .client import supabase

def create_analysis(user_id: str, video_id: str | None, model_version: str):
    return (
        supabase
        .table("analysis")
        .insert({
            "user_id": user_id,
            "video_id": video_id,
            "model_version": model_version,
        })
        .execute()
    )

def list_analysis(user_id: str):
    return (
        supabase
        .table("analysis")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )

def get_analysis(user_id: str, analysis_id: str):
    return (
        supabase
        .table("analysis")
        .select("*")
        .eq("id", analysis_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )


def mark_analysis_started(analysis_id: str):
    return (
        supabase
        .table("analysis")
        .update({
            "status": "processing",
            "started_at": "now()",
        })
        .eq("id", analysis_id)
        .execute()
    )

def mark_analysis_completed(
    analysis_id: str,
    success: bool,
    raw_output_json: dict | None = None,
):
    return (
        supabase
        .table("analysis")
        .update({
            "status": "completed" if success else "failed",
            "success": success,
            "raw_output_json": raw_output_json,
            "completed_at": "now()",
        })
        .eq("id", analysis_id)
        .execute()
    )
