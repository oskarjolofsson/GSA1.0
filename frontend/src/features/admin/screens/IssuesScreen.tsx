import { 
    RefreshCw, Search, Plus, Trash2, Filter, ArrowUpDown, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import IssueEditModal from '../components/IssueEditModal';
import useIssueTable from '../hooks/useIssueTable';
import { IssueRow } from '@/features/issues/components/adminTableRow';

export default function IssuesScreen() {
    const { state, data, actions } = useIssueTable();

    if (data.loading) {
        return (
            <div className="justify-center p-10">
                <div className="text-3xl font-bold mb-6 text-white ml-6">Issues Management</div>
                <div className="ml-6 mt-8">
                    <div className="bg-[#0e1428]/80 backdrop-blur-md border border-white/10 rounded-lg p-6">
                        <p className="text-white/60">Loading issues...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (data.error) {
        return (
            <div className="justify-center p-10">
                <div className="text-3xl font-bold mb-6 text-white ml-6">Issues Management</div>
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
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" size={20} />
                            <input
                                type="text"
                                placeholder="Search by title or motion..."
                                value={state.searchTerm}
                                onChange={(e) => actions.setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-[#0b1020] border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                        </div>
                        
                        {/* Filter Toggle */}
                        <button
                            onClick={() => actions.setShowFilters(!state.showFilters)}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-white transition-colors ${
                                state.showFilters ? 'bg-blue-500/20 border-blue-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                        >
                            <Filter size={16} />
                            Filters
                        </button>
                    </div>

                    {/* Expanded Filters */}
                    {state.showFilters && (
                        <div className="mb-4 p-4 bg-[#0b1020] border border-white/10 rounded-lg">
                            <div className="flex flex-wrap gap-4">
                                <div>
                                    <label className="text-white/60 text-sm block mb-1">Phase</label>
                                    <select
                                        value={state.phaseFilter}
                                        onChange={(e) => actions.setPhaseFilter(e.target.value)}
                                        className="px-3 py-2 bg-[#0e1428] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
                                    >
                                        <option value="all">All Phases</option>
                                        {data.uniquePhases.map(phase => (
                                            <option key={phase} value={phase}>{phase}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bulk Actions */}
                    {state.selectedIds.size > 0 && (
                        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-between">
                            <span className="text-white/80">
                                {state.selectedIds.size} {state.selectedIds.size === 1 ? 'issue' : 'issues'} selected
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
                        Showing {data.paginatedIssues.length} of {data.filteredAndSortedIssues.length} issues
                    </div>

                    {/* Table */}
                    <div className="w-full">
                        {/* Table Header */}
                        <div className="hidden sm:grid sm:grid-cols-[auto_2fr_1fr_auto_auto] gap-4 border-b border-white/10 pb-3 mb-2">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={state.selectedIds.size === data.paginatedIssues.length && data.paginatedIssues.length > 0}
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
                                onClick={() => actions.handleSort('phase')}
                                className="flex items-center gap-1 text-left text-white/80 font-medium hover:text-white transition-colors"
                            >
                                Phase
                                <ArrowUpDown size={14} className={state.sortField === 'phase' ? 'text-blue-400' : 'text-white/40'} />
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
                        {data.paginatedIssues.length === 0 ? (
                            <div className="text-white/60 text-center py-8">
                                No issues found matching your criteria.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {data.paginatedIssues.map((issue) => (
                                    <IssueRow
                                        key={issue.id}
                                        issue={issue}
                                        isExpanded={state.expandedIds.has(issue.id)}
                                        isSelected={state.selectedIds.has(issue.id)}
                                        onToggleExpand={() => actions.toggleExpand(issue.id)}
                                        onToggleSelect={() => actions.toggleSelect(issue.id)}
                                        onEdit={() => actions.setEditingIssue(issue)}
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