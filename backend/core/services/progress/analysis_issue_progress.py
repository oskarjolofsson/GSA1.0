# Custom imports
from datetime import datetime
from uuid import UUID

from core.infrastructure.db import models
from core.services.dtos.issues_service_dto import SimplifiedIssueProgressDTO


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
        drill_runs_by_session: dict[UUID, list[models.PracticeDrillRun]] = {}
        for drill_run in drill_runs:
            drill_runs_by_session.setdefault(drill_run.session_id, []).append(drill_run)

        # Number-counts
        completed_sessions = sum(1 for session in sessions if session.status == "completed")
        total_successful_reps = sum(drill_run.successful_reps for drill_run in drill_runs)
        total_failed_reps = sum(drill_run.failed_reps for drill_run in drill_runs)
        completed_ordered_sessions = sorted(
            [session for session in sessions if session.status == "completed"],
            key=lambda session: session.completed_at or session.started_at or datetime.min,
            reverse=True,
        )
        recent_completed_sessions = completed_ordered_sessions[:5]

        recent_successful_reps = 0
        recent_failed_reps = 0
        session_rates_oldest_to_newest: list[float] = []
        for session in reversed(recent_completed_sessions):
            session_drill_runs = drill_runs_by_session.get(session.id, [])
            session_successful_reps = sum(drill_run.successful_reps for drill_run in session_drill_runs)
            session_failed_reps = sum(drill_run.failed_reps for drill_run in session_drill_runs)

            recent_successful_reps += session_successful_reps
            recent_failed_reps += session_failed_reps

            session_rate = self.compute_success_rate(session_successful_reps, session_failed_reps)
            if session_rate is not None:
                session_rates_oldest_to_newest.append(session_rate)

        # Success rates
        overall_success_rate = self.compute_success_rate(total_successful_reps, total_failed_reps)
        recent_session_success_rates = self.compute_success_rate(recent_successful_reps, recent_failed_reps)
        delta = self.compute_delta(session_rates_oldest_to_newest)
        
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
            delta=delta,
            last_completed_at=last_completed_at

        )
        
        
    def compute_success_rate(self, successful: int, failure: int):
        if successful + failure == 0: return None
        return successful / (successful + failure)


    def compute_delta(self, session_rates: list[float]) -> float | None:
        if len(session_rates) < 2:
            return None

        return session_rates[-1] - session_rates[0]
    
    
    def compute_trend(self, recent_rates: list[float]):
        if len(recent_rates) < 2: return "insufficient_data"

        first = recent_rates[0]
        last = recent_rates[-1]
        delta = last - first

        if delta >= 0.10: return "improving"
        elif delta <= -0.10: return "declining"
        else: return "stable"
        
        
            
        