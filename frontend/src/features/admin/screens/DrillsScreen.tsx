import {
    RefreshCw, Search, ChevronDown, ChevronUp, Plus, Trash2, CheckCircle, ArrowUpDown, ChevronLeft, ChevronRight, Edit, X
} from 'lucide-react';

import DrillEditModal from '../components/DrillEditModal';
import useDrillTable from '../hooks/useDrillTable';
import DrillRow from '@/features/drills/components/adminTableRow'

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
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" size={20} />
                            <input
                                type="text"
                                placeholder="Search by title or task..."
                                value={state.searchTerm}
                                onChange={(e) => actions.setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-[#0b1020] border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Expanded Filters */}
                    {state.showFilters && (
                        <div className="mb-4 p-4 bg-[#0b1020] border border-white/10 rounded-lg">
                            <div className="flex flex-wrap gap-4">
                                <div>
                                    <label className="text-white/60 text-sm block mb-1">Status</label>
                                    <select
                                        value={state.statusFilter}
                                        onChange={(e) => actions.setStatusFilter(e.target.value)}
                                        className="px-3 py-2 bg-[#0e1428] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
                                    >
                                        <option value="all">All</option>
                                        <option value="published">Published</option>
                                        <option value="draft">Draft</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bulk Actions */}
                    {state.selectedIds.size > 0 && (
                        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-between">
                            <span className="text-white/80">
                                {state.selectedIds.size} {state.selectedIds.size === 1 ? 'drill' : 'drills'} selected
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={actions.handleBulkDelete}
                                    className="flex items-center gap-1 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded text-white text-sm transition-colors"
                                >
                                    <Trash2 size={14} />
                                    Delete
                                </button>
                                <button
                                    onClick={actions.clearSelection}
                                    className="flex items-center gap-1 px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded text-white text-sm transition-colors"
                                >
                                    <X size={14} />
                                    Clear
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Results count */}
                    <div className="mb-2 text-white/60 text-sm">
                        Showing {data.paginatedDrills.length} of {data.filteredAndSortedDrills.length} drills
                    </div>

                    {/* Table */}
                    <div className="w-full">
                        {/* Table Header */}
                        <div className="hidden sm:grid sm:grid-cols-[auto_2fr_3fr_auto_auto] gap-4 border-b border-white/10 pb-3 mb-2">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={state.selectedIds.size === data.paginatedDrills.length && data.paginatedDrills.length > 0}
                                    onChange={actions.toggleSelectAll}
                                    className="w-4 h-4 rounded bg-[#0b1020] border-white/20"
                                />
                            </div>
                            <button
                                onClick={() => actions.handleSort('title')}
                                className="flex items-center gap-1 text-left text-white/80 font-medium hover:text-white transition-colors"
                            >
                                Title
                                <ArrowUpDown size={14} className={state.sortField === 'title' ? 'text-blue-400' : 'text-white/40'} />
                            </button>
                            <button
                                onClick={() => actions.handleSort('task')}
                                className="flex items-center gap-1 text-left text-white/80 font-medium hover:text-white transition-colors"
                            >
                                Task
                                <ArrowUpDown size={14} className={state.sortField === 'task' ? 'text-blue-400' : 'text-white/40'} />
                            </button>
                            <button
                                onClick={() => actions.handleSort('created_at')}
                                className="flex items-center gap-1 text-white/80 font-medium hover:text-white transition-colors"
                            >
                                Created
                                <ArrowUpDown size={14} className={state.sortField === 'created_at' ? 'text-blue-400' : 'text-white/40'} />
                            </button>
                            <div className="text-white/80 font-medium text-center">Actions</div>
                        </div>

                        {/* Table Body */}
                        {data.paginatedDrills.length === 0 ? (
                            <div className="text-white/60 text-center py-8">
                                No drills found matching your criteria.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {data.paginatedDrills.map((drill) => (
                                    <DrillRow
                                        key={drill.id}
                                        drill={drill}
                                        isExpanded={state.expandedIds.has(drill.id)}
                                        isSelected={state.selectedIds.has(drill.id)}
                                        onToggleExpand={() => actions.toggleExpand(drill.id)}
                                        onToggleSelect={() => actions.toggleSelect(drill.id)}
                                        onEdit={() => actions.setEditingDrill(drill)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {data.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                            <div className="text-white/60 text-sm">
                                Page {state.currentPage} of {data.totalPages}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => actions.setCurrentPage(Math.max(1, state.currentPage - 1))}
                                    disabled={state.currentPage === 1}
                                    className="flex items-center gap-1 px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={16} />
                                    Previous
                                </button>
                                <button
                                    onClick={() => actions.setCurrentPage(Math.min(data.totalPages, state.currentPage + 1))}
                                    disabled={state.currentPage === data.totalPages}
                                    className="flex items-center gap-1 px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
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

