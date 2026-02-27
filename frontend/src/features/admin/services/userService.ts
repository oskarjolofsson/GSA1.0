import { type DbUser } from "../types";
import { supabase } from '@/lib/supabase';

const API = import.meta.env.VITE_API_URL || '';

export class UserService {

    private async fetchWithAuth<T>(
    url: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
    body: any = null
): Promise<T> {
        const {
            data: { session },
            error
        } = await supabase.auth.getSession();

        if (error) throw error;
        if (!session) throw new Error('Not signed in');

        const options: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
            },
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${API}${url}`, options);

        if (!response.ok) {
            try {
                const errorData = await response.json();
                throw new Error(errorData.detail || `Server error ${response.status}`);
            } catch (jsonError) {
                // Fallback if response is not JSON
                throw new Error(`Server error ${response.status}: ${response.statusText}`);
            }
        }

        // Handle 204 No Content
        if (response.status === 204) {
            return {} as any;
        }

        const data = await response.json() as Promise<T>;
        return data as T;
    }


    async getAllUsers(): Promise<DbUser[]> {
        return this.fetchWithAuth<DbUser[]>('/api/v1/users/all', 'GET');
    }
}