

export interface DbUser {
    id: string;
    email: string;
    name: string;

    role: string;
    authProvider?: 'email' | 'google' | 'apple';
    status?: 'active' | 'disabled' | 'banned';
    analysesCount?: number;
    drillsCompleted?: number;

    createdAt: Date;
    lastSignIn: Date | null;
    updatedAt: Date;
}