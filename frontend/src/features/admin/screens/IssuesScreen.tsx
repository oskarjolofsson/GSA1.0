import { 
    RefreshCw, Plus
} from 'lucide-react';
import IssueEditModal from '../components/IssueEditModal';
import AdminTable, { ColumnConfig } from '../components/AdminTable';
import Pagination from '../components/Pagination';
import BulkActions from '../components/BulkActions';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import FilterSelect from '../components/FilterSelect';
import { LoadingState, ErrorState } from '../../../shared/components/cards/error';
import useIssueTable, { SortField } from '../hooks/useIssueTable';
import { IssueRow } from '@/features/issues/components/adminTableRow';
import type { Issue } from '@/features/issues/types';

const ISSUE_COLUMNS: ColumnConfig<SortField>[] = [
    { label: 'Title', sortField: 'title' },
    { label: 'Phase', sortField: 'phase' },
    { label: 'Created', sortField: 'created_at' },
];

export default function IssuesScreen() {
    const { state, data, actions } = useIssueTable();

    if (data.loading) {
        return <LoadingState title="Issues Management" message="Loading issues..." />;
    }

    if (data.error) {
        return (
            <ErrorState
                title="Issues Management"
                error={data.error}
                onRetry={actions.refetch}
            />
        );
    }

    return (
        <div className="justify-center p-2 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 mx-2 sm:mx-6 gap-4">
                <h1 className="text-3xl font-bold text-white">Issues Management</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => actions.setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-white transition-colors"
                    >
                        <Plus size={16} />
                        New Issue
                    </button>
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
                    {/* Search and Filter Bar */}
                    <SearchBar
                        value={state.searchTerm}
                        onChange={actions.setSearchTerm}
                        placeholder="Search by title or motion..."
                        filterToggle={{
                            showFilters: state.showFilters,
                            onToggle: () => actions.setShowFilters(!state.showFilters)
                        }}
                    />

                    {/* Expanded Filters */}
                    <FilterPanel show={state.showFilters}>
                        <FilterSelect
                            label="Phase"
                            value={state.phaseFilter}
                            onChange={actions.setPhaseFilter}
                            options={[
                                { value: 'all', label: 'All Phases' },
                                ...data.uniquePhases.map(phase => ({ value: phase, label: phase }))
                            ]}
                        />
                    </FilterPanel>

                    {/* Bulk Actions */}
                    <BulkActions
                        selectedCount={state.selectedIds.size}
                        entityName="issue"
                        entityNamePlural="issues"
                        onDelete={actions.handleBulkDelete}
                        onClear={actions.clearSelection}
                    />

                    {/* Results count */}
                    <div className="mb-2 text-white/60 text-sm">
                        Showing {data.paginatedIssues.length} of {data.filteredAndSortedIssues.length} issues
                    </div>

                    {/* Table */}
                    <AdminTable<Issue, SortField>
                        columns={ISSUE_COLUMNS}
                        items={data.paginatedIssues}
                        gridClass="sm:grid-cols-[auto_2fr_1fr_auto_auto]"
                        emptyMessage="No issues found matching your criteria."
                        selectedIds={state.selectedIds}
                        totalItems={data.filteredAndSortedIssues.length}
                        sortField={state.sortField}
                        onSort={actions.handleSort}
                        onToggleSelectAll={actions.toggleSelectAll}
                        getItemId={(issue) => issue.id}
                        renderRow={(issue) => (
                            <IssueRow
                                issue={issue}
                                isExpanded={state.expandedIds.has(issue.id)}
                                isSelected={state.selectedIds.has(issue.id)}
                                onToggleExpand={() => actions.toggleExpand(issue.id)}
                                onToggleSelect={() => actions.toggleSelect(issue.id)}
                                onEdit={() => actions.setEditingIssue(issue)}
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

            {/* Edit Modal */}
            {state.editingIssue && (
                <IssueEditModal
                    issue={state.editingIssue}
                    drills={data.drills}
                    onClose={() => actions.setEditingIssue(null)}
                    onSave={() => {
                        actions.setEditingIssue(null);
                        actions.refetch();
                    }}
                />
            )}

            {/* Create Modal */}
            {state.showCreateModal && (
                <IssueEditModal
                    issue={null}
                    drills={data.drills}
                    onClose={() => actions.setShowCreateModal(false)}
                    onSave={() => {
                        actions.setShowCreateModal(false);
                        actions.refetch();
                    }}
                />
            )}
        </div>
    );
}