import { RefreshCw } from 'lucide-react';

import AdminTable, { ColumnConfig } from '../components/AdminTable';
import Pagination from '../components/Pagination';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import FilterSelect from '../components/FilterSelect';
import { LoadingState, ErrorState } from '../components/error';
import useFeedbackTable, { SortField } from '@/features/feedback/hooks/useFeedbackTable';
import FeedbackRow from '@/features/feedback/components/FeedbackRow';
import type { Feedback } from '@/features/feedback/types';

const FEEDBACK_COLUMNS: ColumnConfig<SortField>[] = [
    { label: 'Rating', sortField: 'rating' },
    { label: 'Comments', sortField: 'comments' },
    { label: 'Submitted', sortField: 'createdAt' },
];

export default function FeedbackScreen() {
    const { state, data, actions } = useFeedbackTable();

    if (data.loading) {
        return <LoadingState title="Feedback Management" message="Loading feedback..." />;
    }

    if (data.error) {
        return (
            <ErrorState
                title="Feedback Management"
                error={data.error}
                onRetry={actions.refetch}
            />
        );
    }

    return (
        <div className="justify-center p-2 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 mx-2 sm:mx-6 gap-4">
                <h1 className="text-3xl font-bold text-white">Feedback Management</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={actions.refetch}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-white transition-colors"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="mx-2 sm:mx-6">
                <div className="bg-[#0e1428]/80 backdrop-blur-md border border-white/10 rounded-lg p-4 sm:p-6">
                    {/* Search Bar */}
                    <SearchBar
                        value={state.searchTerm}
                        onChange={actions.setSearchTerm}
                        placeholder="Search by comments..."
                    />

                    {/* Expanded Filters */}
                    <FilterPanel show={state.showFilters}>
                        <FilterSelect
                            label="Rating"
                            value={state.ratingFilter}
                            onChange={actions.setRatingFilter}
                            options={[
                                { value: 'all', label: 'All Ratings' },
                                { value: '3', label: '3 Stars' },
                                { value: '2', label: '2 Stars' },
                                { value: '1', label: '1 Star' },
                            ]}
                        />
                    </FilterPanel>

                    {/* Results count */}
                    <div className="mb-2 text-white/60 text-sm">
                        Showing {data.paginatedFeedbacks.length} of {data.filteredAndSortedFeedbacks.length} feedback entries
                    </div>

                    {/* Table */}
                    <AdminTable<Feedback, SortField>
                        columns={FEEDBACK_COLUMNS}
                        items={data.paginatedFeedbacks}
                        gridClass="sm:grid-cols-[auto_1fr_2fr_auto_auto]"
                        emptyMessage="No feedback found matching your criteria."
                        selectedIds={state.selectedIds}
                        totalItems={data.filteredAndSortedFeedbacks.length}
                        sortField={state.sortField}
                        onSort={actions.handleSort}
                        onToggleSelectAll={actions.toggleSelectAll}
                        getItemId={(feedback) => String(feedback.id)}
                        renderRow={(feedback) => (
                            <FeedbackRow
                                feedback={feedback}
                                isExpanded={state.expandedIds.has(feedback.id)}
                                isSelected={state.selectedIds.has(String(feedback.id))}
                                onToggleExpand={() => actions.toggleExpand(feedback.id)}
                                onToggleSelect={() => actions.toggleSelect(String(feedback.id))}
                            />
                        )}
                    />

                    {/* Pagination */}
                    <Pagination
                        currentPage={state.currentPage}
                        totalPages={data.totalPages}
                        onPageChange={actions.setCurrentPage}
                    />
                </div>
            </div>
        </div>
    );
}