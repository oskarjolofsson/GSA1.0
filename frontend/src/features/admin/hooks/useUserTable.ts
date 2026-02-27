import { useEffect, useState } from 'react';
import { UserService } from '../services/userService';
import { DbUser } from '../types';

interface UseUserTableResult {
    users: DbUser[];
}

export function useUserTable(): UseUserTableResult {

    const [users, setUsers] = useState<DbUser[]>([]);
    const userService = new UserService();

    useEffect(() => {
        userService.getAllUsers().then(setUsers);
    }, []);

    return { 
        users 
    };
}