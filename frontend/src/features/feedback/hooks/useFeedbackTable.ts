import { useState, useMemo, useEffect } from 'react';
import { feedbackService } from '../services/feedbackService';
import type { Feedback } from '../types';

export type SortField = 'rating' | 'comments' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

export interface FeedbackTableState {
    searchTerm: string;
    ratingFilter: string;
    showFilters: boolean;
    sortField: SortField;
    sortDirection: SortDirection;
    selectedIds: Set<string>;
    expandedIds: Set<number>;
    currentPage: number;
}

export interface FeedbackTableData {
    feedbacks: Feedback[];
    filteredAndSortedFeedbacks: Feedback[];
    paginatedFeedbacks: Feedback[];
    totalPages: number;
    loading: boolean;
    error: string | null;
}

export interface FeedbackTableActions {
    setSearchTerm: (value: string) => void;
    setRatingFilter: (value: string) => void;
    setShowFilters: (show: boolean) => void;
    handleSort: (field: SortField) => void;
    toggleSelect: (id: string) => void;
    toggleSelectAll: () => void;
    toggleExpand: (id: number) => void;
    clearSelection: () => void;
    setCurrentPage: (page: number) => void;
    refetch: () => void;
}

export interface UseFeedbackTableReturn {
    state: FeedbackTableState;
    data: FeedbackTableData;
    actions: FeedbackTableActions;
}

export default function useFeedbackTable(): UseFeedbackTableReturn {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [ratingFilter, setRatingFilter] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);

    const [sortField, setSortField] = useState<SortField>('createdAt');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

    const [currentPage, setCurrentPage] = useState(1);

    const fetchFeedbacks = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await feedbackService.getFeedback();
            setFeedbacks(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch feedbacks');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    const filteredAndSortedFeedbacks = useMemo(() => {
        let result = [...feedbacks];

        // Filter by search term (comments)
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(feedback =>
                feedback.comments?.toLowerCase().includes(lowerSearch)
            );
        }

        // Filter by rating
        if (ratingFilter !== 'all') {
            const rating = parseInt(ratingFilter, 10);
            result = result.filter(feedback => feedback.rating === rating);
        }

        // Sort
        result.sort((a, b) => {
            let comparison = 0;
            switch (sortField) {
                case 'rating':
                    comparison = a.rating - b.rating;
                    break;
                case 'comments':
                    comparison = (a.comments || '').localeCompare(b.comments || '');
                    break;
                case 'createdAt':
                    comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    break;
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [feedbacks, searchTerm, ratingFilter, sortField, sortDirection]);

    // Pagination logic
    const totalPages = Math.ceil(filteredAndSortedFeedbacks.length / ITEMS_PER_PAGE);
    const paginatedFeedbacks = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredAndSortedFeedbacks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredAndSortedFeedbacks, currentPage]);

    // Reset to page 1 when filters change
    const handleSearch = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const handleRatingFilter = (value: string) => {
        setRatingFilter(value);
        setCurrentPage(1);
    };

    // Toggle row expansion
    const toggleExpand = (id: number) => {
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
        if (selectedIds.size === paginatedFeedbacks.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(paginatedFeedbacks.map(f => String(f.id))));
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

    const clearSelection = () => {
        setSelectedIds(new Set());
    };

    const state: FeedbackTableState = {
        searchTerm,
        ratingFilter,
        showFilters,
        sortField,
        sortDirection,
        selectedIds,
        expandedIds,
        currentPage,
    };

    const data: FeedbackTableData = {
        feedbacks,
        filteredAndSortedFeedbacks,
        paginatedFeedbacks,
        totalPages,
        loading,
        error,
    };

    const actions: FeedbackTableActions = {
        setSearchTerm: handleSearch,
        setRatingFilter: handleRatingFilter,
        setShowFilters,
        handleSort,
        toggleSelect,
        toggleSelectAll,
        toggleExpand,
        clearSelection,
        setCurrentPage,
        refetch: fetchFeedbacks,
    };

    return { state, data, actions };
}
