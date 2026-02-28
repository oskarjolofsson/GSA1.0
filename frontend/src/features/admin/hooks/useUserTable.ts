import { useEffect, useState, useMemo, useCallback } from 'react';
import { UserService } from '../services/userService';
import { DbUser } from '../types';
import type { FilterSelectOption } from '../components/FilterSelect';

// Types
export type SortField = 'email' | 'name' | 'role' | 'created_at' | 'last_sign_in';
export type SortDirection = 'asc' | 'desc';

// Constants
const ITEMS_PER_PAGE = 10;

export const STATUS_OPTIONS: FilterSelectOption[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

export const ROLE_OPTIONS: FilterSelectOption[] = [
    { value: 'all', label: 'All Roles' },
    { value: 'admin', label: 'Admin' },
    { value: 'pro', label: 'Pro' },
    { value: 'user', label: 'User' },
];

interface UseUserTableResult {
    // Data
    users: DbUser[];
    paginatedUsers: DbUser[];
    filteredCount: number;
    
    // State values
    searchTerm: string;
    activeFilter: string;
    roleFilter: string;
    showFilters: boolean;
    sortField: SortField;
    sortDirection: SortDirection;
    currentPage: number;
    totalPages: number;
    
    // Handlers
    handleSearch: (value: string) => void;
    handleActiveFilter: (value: string) => void;
    handleRoleFilter: (value: string) => void;
    toggleFilters: () => void;
    handleSort: (field: SortField) => void;
    handlePageChange: (page: number) => void;
    
    // Modal state
    selectedUser: DbUser | null;
    setSelectedUser: (user: DbUser | null) => void;
}

export function useUserTable(): UseUserTableResult {
    // Data state
    const [users, setUsers] = useState<DbUser[]>([]);
    const userService = new UserService();

    // Search and filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    
    // Sort state
    const [sortField, setSortField] = useState<SortField>('email');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    
    // Modal state
    const [selectedUser, setSelectedUser] = useState<DbUser | null>(null);

    // Fetch users
    useEffect(() => {
        userService.getAllUsers().then(setUsers);
    }, []);

    // Filter and sort users
    const filteredAndSortedUsers = useMemo(() => {
        let result: DbUser[] = [...users];

        // Apply search filter (email exact or partial, name partial)
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(user =>
                user.email.toLowerCase().includes(lowerSearch) ||
                (user.name && user.name.toLowerCase().includes(lowerSearch))
            );
        }

        // Apply active filter
        if (activeFilter !== 'all') {
            const isActive = activeFilter === 'active';
            result = result.filter(user => user.active === isActive);
        }

        // Apply role filter
        if (roleFilter !== 'all') {
            result = result.filter(user => user.role === roleFilter);
        }

        // Apply sorting
        result.sort((a, b) => {
            let comparison = 0;
            switch (sortField) {
                case 'email':
                    comparison = a.email.localeCompare(b.email);
                    break;
                case 'name':
                    comparison = (a.name || '').localeCompare(b.name || '');
                    break;
                case 'role':
                    comparison = a.role.localeCompare(b.role);
                    break;
                case 'created_at':
                    comparison = a.createdAt.getTime() - b.createdAt.getTime();
                    break;
                case 'last_sign_in':
                    const aTime = a.lastSignIn?.getTime() ?? 0;
                    const bTime = b.lastSignIn?.getTime() ?? 0;
                    comparison = aTime - bTime;
                    break;
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [users, searchTerm, activeFilter, roleFilter, sortField, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedUsers.length / ITEMS_PER_PAGE);
    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredAndSortedUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredAndSortedUsers, currentPage]);

    // Handlers with page reset
    const handleSearch = useCallback((value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    }, []);

    const handleActiveFilter = useCallback((value: string) => {
        setActiveFilter(value);
        setCurrentPage(1);
    }, []);

    const handleRoleFilter = useCallback((value: string) => {
        setRoleFilter(value);
        setCurrentPage(1);
    }, []);

    const toggleFilters = useCallback(() => {
        setShowFilters(prev => !prev);
    }, []);

    const handleSort = useCallback((field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    }, [sortField]);

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    return { 
        // Data
        users,
        paginatedUsers,
        filteredCount: filteredAndSortedUsers.length,
        
        // State values
        searchTerm,
        activeFilter,
        roleFilter,
        showFilters,
        sortField,
        sortDirection,
        currentPage,
        totalPages,
        
        // Handlers
        handleSearch,
        handleActiveFilter,
        handleRoleFilter,
        toggleFilters,
        handleSort,
        handlePageChange,
        
        // Modal state
        selectedUser,
        setSelectedUser,
    };
}