# only backend
from .client import supabase

def insert_issue(
    analysis_id: str,
    issue_code: str,
    impact_rank: int,
    phase=None,
    severity=None,
    confidence=None,
    current_motion=None,
    expected_motion=None,
    swing_effect=None,
    shot_outcome=None,
):
    return (
        supabase
        .table("analysis_issues")
        .insert({
            "analysis_id": analysis_id,
            "issue_code": issue_code,
            "impact_rank": impact_rank,
            "phase": phase,
            "severity": severity,
            "confidence": confidence,
            "current_motion": current_motion,
            "expected_motion": expected_motion,
            "swing_effect": swing_effect,
            "shot_outcome": shot_outcome,
        })
        .execute()
    )

def list_issues_for_analysis(analysis_id: str):
    return (
        supabase
        .table("analysis_issues")
        .select("*")
        .eq("analysis_id", analysis_id)
        .order("impact_rank")
        .execute()
    )