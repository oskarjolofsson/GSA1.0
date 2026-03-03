from dataclasses import dataclass


@dataclass
class AdminStatsDTO:
    """DTO for admin dashboard statistics."""
    
    total_drills: int
    total_issues: int
    total_mappings: int
    total_users: int
    unmapped_drills: int
    issues_with_no_drills: int
    new_users_last_7_days: int
    new_users_last_30_days: int
