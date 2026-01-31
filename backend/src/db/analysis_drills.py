# db/analysis_drills.py
from .client import supabase

def insert_drill(
    analysis_issue_id: str,
    title: str,
    task: str,
    success_signal: str,
    fault_indicator: str,
):
    return (
        supabase
        .table("analysis_drills")
        .insert({
            "analysis_issue_id": analysis_issue_id,
            "title": title,
            "task": task,
            "success_signal": success_signal,
            "fault_indicator": fault_indicator,
        })
        .execute()
    )
