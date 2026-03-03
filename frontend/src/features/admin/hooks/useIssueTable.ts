import { useState, useMemo } from 'react';
import { useAdminData } from './useAdminData';
import type { Issue } from '@/features/issues/types';
import type { Drill } from '@/features/drills/types';
import issueService from '@/features/issues/services/issueService';

export type SortField = 'title' | 'phase' | 'created_at';
export type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

export interface IssueTableState {
    searchTerm: string;
    phaseFilter: string;
    showFilters: boolean;
    sortField: SortField;
    sortDirection: SortDirection;
    selectedIds: Set<string>;
    expandedIds: Set<string>;
    currentPage: number;
    editingIssue: Issue | null;
    showCreateModal: boolean;
}

export interface IssueTableData {
    issues: Issue[];
    drills: Drill[];
    uniquePhases: string[];
    filteredAndSortedIssues: Issue[];
    paginatedIssues: Issue[];
    totalPages: number;
    loading: boolean;
    error: unknown;
}

export interface IssueTableActions {
    setSearchTerm: (value: string) => void;
    setPhaseFilter: (value: string) => void;
    setShowFilters: (show: boolean) => void;
    handleSort: (field: SortField) => void;
    toggleSelect: (id: string) => void;
    toggleSelectAll: () => void;
    toggleExpand: (id: string) => void;
    handleBulkDelete: () => Promise<void>;
    clearSelection: () => void;
    setEditingIssue: (issue: Issue | null) => void;
    setShowCreateModal: (show: boolean) => void;
    setCurrentPage: (page: number) => void;
    refetch: () => void;
}

export interface UseIssueTableReturn {
    state: IssueTableState;
    data: IssueTableData;
    actions: IssueTableActions;
}

export default function useIssueTable(): UseIssueTableReturn {
    const { issues, drills, loading, error, refetch } = useAdminData();

    const [searchTerm, setSearchTerm] = useState('');
    const [phaseFilter, setPhaseFilter] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);

    const [sortField, setSortField] = useState<SortField>('created_at');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const [currentPage, setCurrentPage] = useState(1);

    const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Get unique phases for filter
    const uniquePhases = useMemo(() => {
        const phases = new Set<string>();
        issues.forEach(issue => {
            if (issue.phase) phases.add(issue.phase);
        });
        return Array.from(phases).sort();
    }, [issues]);

    const filteredAndSortedIssues = useMemo(() => {
        let result = [...issues];

        // Apply search filter
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(issue =>
                issue.title.toLowerCase().includes(lowerSearch) ||
                (issue.current_motion && issue.current_motion.toLowerCase().includes(lowerSearch)) ||
                (issue.expected_motion && issue.expected_motion.toLowerCase().includes(lowerSearch))
            );
        }

        // Apply phase filter
        if (phaseFilter !== 'all') {
            result = result.filter(issue => issue.phase === phaseFilter);
        }

        // Apply sorting
        result.sort((a, b) => {
            let comparison = 0;
            switch (sortField) {
                case 'title':
                    comparison = a.title.localeCompare(b.title);
                    break;
                case 'phase':
                    comparison = (a.phase || '').localeCompare(b.phase || '');
                    break;
                case 'created_at':
                    comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                    break;
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [issues, searchTerm, phaseFilter, sortField, sortDirection]);

    // Pagination logic
    const totalPages = Math.ceil(filteredAndSortedIssues.length / ITEMS_PER_PAGE);
    const paginatedIssues = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredAndSortedIssues.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredAndSortedIssues, currentPage]);

    // Reset to page 1 when filters change
    const handleSearch = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const handlePhaseFilter = (value: string) => {
        setPhaseFilter(value);
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
        if (selectedIds.size === paginatedIssues.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(paginatedIssues.map(i => i.id)));
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
            await issueService.bulkDeleteIssues(Array.from(selectedIds));
            refetch();
        } catch (err) {
            console.error('Failed to delete issues:', err);
        } finally {
            setSelectedIds(new Set());
        }
    };

    const clearSelection = () => {
        setSelectedIds(new Set());
    };

    const state: IssueTableState = {
        searchTerm,
        phaseFilter,
        showFilters,
        sortField,
        sortDirection,
        selectedIds,
        expandedIds,
        currentPage,
        editingIssue,
        showCreateModal,
    };

    const data: IssueTableData = {
        issues,
        drills,
        uniquePhases,
        filteredAndSortedIssues,
        paginatedIssues,
        totalPages,
        loading,
        error,
    };

    const actions: IssueTableActions = {
        setSearchTerm: handleSearch,
        setPhaseFilter: handlePhaseFilter,
        setShowFilters,
        handleSort,
        toggleSelect,
        toggleSelectAll,
        toggleExpand,
        handleBulkDelete,
        clearSelection,
        setEditingIssue,
        setShowCreateModal,
        setCurrentPage,
        refetch,
    };

    return { state, data, actions };
}
