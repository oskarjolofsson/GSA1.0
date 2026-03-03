

export interface DbUser {
    id: string;
    email: string;
    name: string;

    role: string;
    authProvider?: 'email' | 'google' | 'apple';
    active?: boolean;
    analysesCount?: number;
    drillsCompleted?: number;

    createdAt: Date;
    lastSignIn: Date | null;
    updatedAt: Date;
}

export interface AdminStats {
    totalDrills: number;
    totalIssues: number;
    totalMappings: number;
    totalUsers: number;
    unmappedDrills: number;
    issuesWithNoDrills: number;
    newUsersLast7Days: number;
    newUsersLast30Days: number;
}