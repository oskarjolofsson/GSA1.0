from pydantic import BaseModel, ConfigDict
from core.services.dtos.admin_stats_dto import AdminStatsDTO


class AdminStatsResponse(BaseModel):
    """Response schema for admin dashboard statistics."""
    
    totalDrills: int
    totalIssues: int
    totalMappings: int
    totalUsers: int
    unmappedDrills: int
    issuesWithNoDrills: int
    newUsersLast7Days: int
    newUsersLast30Days: int

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_domain(cls, dto: AdminStatsDTO) -> "AdminStatsResponse":
        """Convert AdminStatsDTO to AdminStatsResponse schema."""
        return cls(
            totalDrills=dto.total_drills,
            totalIssues=dto.total_issues,
            totalMappings=dto.total_mappings,
            totalUsers=dto.total_users,
            unmappedDrills=dto.unmapped_drills,
            issuesWithNoDrills=dto.issues_with_no_drills,
            newUsersLast7Days=dto.new_users_last_7_days,
            newUsersLast30Days=dto.new_users_last_30_days,
        )

class AdminVerifyResponse(BaseModel):
    is_admin: bool