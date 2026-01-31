# db/videos.py
from .client import supabase

def create_video(
    user_id: str,
    video_key: str,
    start_time=None,
    end_time=None,
    camera_view="unknown",
    club_type="unknown",
):
    return (
        supabase
        .table("videos")
        .insert({
            "user_id": user_id,
            "video_key": video_key,
            "start_time": start_time,
            "end_time": end_time,
            "camera_view": camera_view,
            "club_type": club_type,
        })
        .execute()
    )

def list_videos(user_id: str):
    return (
        supabase
        .table("videos")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )

def delete_video(user_id: str, video_id: str):
    return (
        supabase
        .table("videos")
        .delete()
        .eq("id", video_id)
        .eq("user_id", user_id)
        .execute()
    )
