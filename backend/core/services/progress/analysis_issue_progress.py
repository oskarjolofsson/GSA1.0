# Custom imports
from core.infrastructure.db import models
from core.services.dtos.issues_service_dto import SimplifiedIssueProgressDTO
from sqlalchemy import UUID


class Analysis_progress_service:
    
    def __init__(self, 
                 analysis_issue: list[models.AnalysisIssue], 
                 practice_sessions: list[models.PracticeSession], 
                 drill_runs: list[models.PracticeDrillRun]
                 ):
        
        self.analysis_issues: list[models.AnalysisIssue] = analysis_issue
        self.practice_sessions: list[models.PracticeSession] = practice_sessions
        self.drill_runs: list[models.PracticeDrillRun] = drill_runs


    def get_total_simple_progress(self) -> list[SimplifiedIssueProgressDTO]:
        return [self.calculate_progress(analysis_issue) for analysis_issue in self.analysis_issues]
            
            
    def calculate_progress(self, analysis_issue: models.AnalysisIssue) -> SimplifiedIssueProgressDTO:
        # Get all associated sessions and drill_runs
        sessions: list[models.PracticeSession] = [session for session in self.practice_sessions if session.analysis_issue_id == analysis_issue.id]
        session_ids: list[UUID] = [session.id for session in sessions]
        drill_runs: list[models.PracticeDrillRun] = [drill_run for drill_run in self.drill_runs if drill_run.session_id in session_ids]

        # Number-counts
        completed_sessions = sum(1 for session in sessions if session.status == "completed")
        total_successful_reps = sum(drill_run.successful_reps for drill_run in drill_runs)
        total_failed_reps = sum(drill_run.failed_reps for drill_run in drill_runs)
        last_5_successful_reps = sum(drill_run.successful_reps for drill_run in drill_runs[-5:])
        last_5_failed_reps = sum(drill_run.failed_reps for drill_run in drill_runs[-5:])

        # Success rates
        overall_success_rate = self.compute_success_rate(total_successful_reps, total_failed_reps)
        recent_session_success_rates = self.compute_success_rate(last_5_successful_reps, last_5_failed_reps)
        
        last_completed_at = max(
            (
                session.completed_at for session in sessions
                if session.status == "completed" and session.completed_at is not None
            ),
            default=None,
        )
        
        return SimplifiedIssueProgressDTO(
            completed_sessions=completed_sessions,
            total_successful_reps=total_successful_reps,
            overall_success_rate=overall_success_rate,
            recent_session_success_rates=recent_session_success_rates,
            last_completed_at=last_completed_at

        )
        
        
    def compute_success_rate(self, successful: int, failure: int):
        if successful + failure == 0: return None
        return successful / (successful + failure)
    
    
    def compute_trend(self, recent_rates: list[float]):
        if len(recent_rates) < 2: return "insufficient_data"

        first = recent_rates[0]
        last = recent_rates[-1]
        delta = last - first

        if delta >= 0.10: return "improving"
        elif delta <= -0.10: return "declining"
        else: return "stable"
        
        
            
        