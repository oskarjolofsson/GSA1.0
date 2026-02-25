import {
    RefreshCw, Plus
} from 'lucide-react';

import DrillEditModal from '../components/DrillEditModal';
import AdminTable, { ColumnConfig } from '../components/AdminTable';
import Pagination from '../components/Pagination';
import BulkActions from '../components/BulkActions';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import FilterSelect from '../components/FilterSelect';
import useDrillTable, { SortField } from '../hooks/useDrillTable';
import DrillRow from '@/features/drills/components/adminTableRow';
import type { Drill } from '@/features/drills/types';

const DRILL_COLUMNS: ColumnConfig<SortField>[] = [
    { label: 'Title', sortField: 'title' },
    { label: 'Task', sortField: 'task' },
    { label: 'Created', sortField: 'created_at' },
];

export default function DrillsScreen() {
    const { state, data, actions } = useDrillTable();

    if (data.loading) {
        return (
            <div className="justify-center p-10">
                <div className="text-3xl font-bold mb-6 text-white ml-6">Drills Management</div>
                <div className="ml-6 mt-8">
                    <div className="bg-[#0e1428]/80 backdrop-blur-md border border-white/10 rounded-lg p-6">
                        <p className="text-white/60">Loading drills...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (data.error) {
        return (
            <div className="justify-center p-10">
                <div className="text-3xl font-bold mb-6 text-white ml-6">Drills Management</div>
                <div className="ml-6 mt-8">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
                        <p className="text-red-500">{data.error}</p>
                        <button
                            onClick={actions.refetch}
                            className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-white transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="justify-center p-2 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 mx-2 sm:mx-6 gap-4">
                <h1 className="text-3xl font-bold text-white">Drills Management</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => actions.setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-white transition-colors"
                    >
                        <Plus size={16} />
                        New Drill
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
                    {/* Search Bar */}
                    <SearchBar
                        value={state.searchTerm}
                        onChange={actions.setSearchTerm}
                        placeholder="Search by title or task..."
                    />

                    {/* Expanded Filters */}
                    <FilterPanel show={state.showFilters}>
                        <FilterSelect
                            label="Status"
                            value={state.statusFilter}
                            onChange={actions.setStatusFilter}
                            options={[
                                { value: 'all', label: 'All' },
                                { value: 'published', label: 'Published' },
                                { value: 'draft', label: 'Draft' },
                            ]}
                        />
                    </FilterPanel>

                    {/* Bulk Actions */}
                    <BulkActions
                        selectedCount={state.selectedIds.size}
                        entityName="drill"
                        entityNamePlural="drills"
                        onDelete={actions.handleBulkDelete}
                        onClear={actions.clearSelection}
                    />

                    {/* Results count */}
                    <div className="mb-2 text-white/60 text-sm">
                        Showing {data.paginatedDrills.length} of {data.filteredAndSortedDrills.length} drills
                    </div>

                    {/* Table */}
                    <AdminTable<Drill, SortField>
                        columns={DRILL_COLUMNS}
                        items={data.paginatedDrills}
                        gridClass="sm:grid-cols-[auto_2fr_3fr_auto_auto]"
                        emptyMessage="No drills found matching your criteria."
                        selectedIds={state.selectedIds}
                        totalItems={data.filteredAndSortedDrills.length}
                        sortField={state.sortField}
                        onSort={actions.handleSort}
                        onToggleSelectAll={actions.toggleSelectAll}
                        getItemId={(drill) => drill.id}
                        renderRow={(drill) => (
                            <DrillRow
                                drill={drill}
                                isExpanded={state.expandedIds.has(drill.id)}
                                isSelected={state.selectedIds.has(drill.id)}
                                onToggleExpand={() => actions.toggleExpand(drill.id)}
                                onToggleSelect={() => actions.toggleSelect(drill.id)}
                                onEdit={() => actions.setEditingDrill(drill)}
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
            {state.editingDrill && (
                <DrillEditModal
                    drill={state.editingDrill}
                    issues={data.issues}
                    onClose={() => actions.setEditingDrill(null)}
                    onSave={() => {
                        actions.setEditingDrill(null);
                        actions.refetch();
                    }}
                />
            )}

            {/* Create Modal */}
            {state.showCreateModal && (
                <DrillEditModal
                    drill={null}
                    issues={data.issues}
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

