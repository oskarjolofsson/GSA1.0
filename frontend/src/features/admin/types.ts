

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