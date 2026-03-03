import { useState, useMemo } from 'react';
import { useAdminData } from './useAdminData';
import type { Drill } from '@/features/drills/types';
import type { Issue } from '@/features/issues/types';
import drillService from '@/features/drills/services/drillService';

export type SortField = 'title' | 'task' | 'created_at';
export type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

export interface DrillTableState {
    searchTerm: string;
    statusFilter: string;
    showFilters: boolean;
    sortField: SortField;
    sortDirection: SortDirection;
    selectedIds: Set<string>;
    expandedIds: Set<string>;
    currentPage: number;
    editingDrill: Drill | null;
    showCreateModal: boolean;
}

export interface DrillTableData {
    drills: Drill[];
    issues: Issue[];
    filteredAndSortedDrills: Drill[];
    paginatedDrills: Drill[];
    totalPages: number;
    loading: boolean;
    error: unknown;
}

export interface DrillTableActions {
    setSearchTerm: (value: string) => void;
    setStatusFilter: (value: string) => void;
    setShowFilters: (show: boolean) => void;
    handleSort: (field: SortField) => void;
    toggleSelect: (id: string) => void;
    toggleSelectAll: () => void;
    toggleExpand: (id: string) => void;
    handleBulkDelete: () => Promise<void>;
    clearSelection: () => void;
    setEditingDrill: (drill: Drill | null) => void;
    setShowCreateModal: (show: boolean) => void;
    setCurrentPage: (page: number) => void;
    refetch: () => void;
}

export interface UseDrillTableReturn {
    state: DrillTableState;
    data: DrillTableData;
    actions: DrillTableActions;
}

export default function useDrillTable(): UseDrillTableReturn {
    const { drills, issues, loading, error, refetch } = useAdminData();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);

    const [sortField, setSortField] = useState<SortField>('created_at');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const [currentPage, setCurrentPage] = useState(1);

    const [editingDrill, setEditingDrill] = useState<Drill | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const filteredAndSortedDrills = useMemo(() => {
        let result = [...drills];

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(drill =>
                drill.title.toLowerCase().includes(lowerSearch) ||
                drill.task.toLowerCase().includes(lowerSearch)
            );
        }

        result.sort((a, b) => {
            let comparison = 0;
            switch (sortField) {
                case 'title':
                    comparison = a.title.localeCompare(b.title);
                    break;
                case 'task':
                    comparison = a.task.localeCompare(b.task);
                    break;
                case 'created_at':
                    comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                    break;
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [drills, searchTerm, sortField, sortDirection]);

    // Pagenation logic
    const totalPages = Math.ceil(filteredAndSortedDrills.length / ITEMS_PER_PAGE);
    const paginatedDrills = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredAndSortedDrills.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredAndSortedDrills, currentPage]);

    // Reset to page 1 when filters change
    const handleSearch = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    // Toggle row expansion
    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedIds);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedIds(newExpanded);
    };

    // Selection handlers
    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === paginatedDrills.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(paginatedDrills.map(d => d.id)));
        }
    };

    // Sort handler
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Bulk actions
    const handleBulkDelete = async () => {
        try {
            await drillService.bulkDeleteDrills(Array.from(selectedIds));
            refetch();
        } catch (err) {
            console.error('Failed to delete drills:', err);
        } finally {
            setSelectedIds(new Set());
        }
    };

    const clearSelection = () => {
        setSelectedIds(new Set());
    };

    const state: DrillTableState = {
        searchTerm,
        statusFilter,
        showFilters,
        sortField,
        sortDirection,
        selectedIds,
        expandedIds,
        currentPage,
        editingDrill,
        showCreateModal,
    };

    const data: DrillTableData = {
        drills,
        issues,
        filteredAndSortedDrills,
        paginatedDrills,
        totalPages,
        loading,
        error,
    };

    const actions: DrillTableActions = {
        setSearchTerm: handleSearch,
        setStatusFilter,
        setShowFilters,
        handleSort,
        toggleSelect,
        toggleSelectAll,
        toggleExpand,
        handleBulkDelete,
        clearSelection,
        setEditingDrill,
        setShowCreateModal,
        setCurrentPage,
        refetch,
    };

    return { state, data, actions };
}