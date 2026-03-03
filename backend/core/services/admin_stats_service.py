from sqlalchemy.orm import Session
from core.infrastructure.db.repositories.drills import (
    get_drill_count,
    get_unmapped_drills_count,
)
from core.infrastructure.db.repositories.issues import (
    get_issue_count,
    get_issues_with_no_drills_count,
)
from core.infrastructure.db.repositories.issue_drills import get_mapping_count
from core.infrastructure.db.repositories.profiles import (
    get_profile_count,
    get_new_profiles_count,
)
from .dtos.admin_stats_dto import AdminStatsDTO


def get_admin_stats(db_session: Session) -> AdminStatsDTO:
    """
    Aggregate all admin dashboard statistics.
    
    Uses efficient COUNT queries rather than fetching all records.
    """
    return AdminStatsDTO(
        total_drills=get_drill_count(db_session),
        total_issues=get_issue_count(db_session),
        total_mappings=get_mapping_count(db_session),
        total_users=get_profile_count(db_session),
        unmapped_drills=get_unmapped_drills_count(db_session),
        issues_with_no_drills=get_issues_with_no_drills_count(db_session),
        new_users_last_7_days=get_new_profiles_count(db_session, days=7),
        new_users_last_30_days=get_new_profiles_count(db_session, days=30),
    )
