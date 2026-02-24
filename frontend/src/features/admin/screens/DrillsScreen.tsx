import { useState, useMemo } from 'react';
import { useAdminData } from '../hooks/useAdminData';
import { 
    RefreshCw, 
    Search, 
    ChevronDown, 
    ChevronUp,
    Plus,
    Trash2,
    Archive,
    CheckCircle,
    Filter,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    Edit,
    X
} from 'lucide-react';
import type { Drill } from '@/features/drills/types';
import type { Issue } from '@/features/issues/types';
import DrillEditModal from '../components/DrillEditModal';

type SortField = 'title' | 'task' | 'created_at';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

export default function DrillsScreen() {
    const { drills, issues, loading, error, refetch } = useAdminData();
    
    // Search and filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);
    
    // Sort state
    const [sortField, setSortField] = useState<SortField>('created_at');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    
    // Selection state for bulk actions
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    
    // Expand state for row dropdowns
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    
    // Edit modal state
    const [editingDrill, setEditingDrill] = useState<Drill | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Filter and sort drills
    const filteredAndSortedDrills = useMemo(() => {
        let result = [...drills];

        // Apply search filter
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(drill =>
                drill.title.toLowerCase().includes(lowerSearch) ||
                drill.task.toLowerCase().includes(lowerSearch)
            );
        }

        // Apply sorting
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

    // Pagination
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

    // Bulk actions (placeholder - not connected to API)
    const handleBulkDelete = () => {
        console.log('Delete drills:', Array.from(selectedIds));
        // TODO: Implement bulk delete
        setSelectedIds(new Set());
    };

    const handleBulkArchive = () => {
        console.log('Archive drills:', Array.from(selectedIds));
        // TODO: Implement bulk archive
        setSelectedIds(new Set());
    };

    if (loading) {
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

    if (error) {
        return (
            <div className="justify-center p-10">
                <div className="text-3xl font-bold mb-6 text-white ml-6">Drills Management</div>
                <div className="ml-6 mt-8">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
                        <p className="text-red-500">{error}</p>
                        <button
                            onClick={refetch}
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
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-white transition-colors"
                    >
                        <Plus size={16} />
                        New Drill
                    </button>
                    <button
                        onClick={refetch}
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
                                placeholder="Search by title or task..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-[#0b1020] border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                        </div>
                        
                        {/* Filter Toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-white transition-colors ${
                                showFilters ? 'bg-blue-500/20 border-blue-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                        >
                            <Filter size={16} />
                            Filters
                        </button>
                    </div>

                    {/* Expanded Filters */}
                    {showFilters && (
                        <div className="mb-4 p-4 bg-[#0b1020] border border-white/10 rounded-lg">
                            <div className="flex flex-wrap gap-4">
                                <div>
                                    <label className="text-white/60 text-sm block mb-1">Status</label>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="px-3 py-2 bg-[#0e1428] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
                                    >
                                        <option value="all">All</option>
                                        <option value="published">Published</option>
                                        <option value="draft">Draft</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bulk Actions */}
                    {selectedIds.size > 0 && (
                        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-between">
                            <span className="text-white/80">
                                {selectedIds.size} {selectedIds.size === 1 ? 'drill' : 'drills'} selected
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleBulkArchive}
                                    className="flex items-center gap-1 px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded text-white text-sm transition-colors"
                                >
                                    <Archive size={14} />
                                    Archive
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    className="flex items-center gap-1 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded text-white text-sm transition-colors"
                                >
                                    <Trash2 size={14} />
                                    Delete
                                </button>
                                <button
                                    onClick={() => setSelectedIds(new Set())}
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
                        Showing {paginatedDrills.length} of {filteredAndSortedDrills.length} drills
                    </div>

                    {/* Table */}
                    <div className="w-full">
                        {/* Table Header */}
                        <div className="hidden sm:grid sm:grid-cols-[auto_2fr_3fr_auto_auto] gap-4 border-b border-white/10 pb-3 mb-2">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.size === paginatedDrills.length && paginatedDrills.length > 0}
                                    onChange={toggleSelectAll}
                                    className="w-4 h-4 rounded bg-[#0b1020] border-white/20"
                                />
                            </div>
                            <button
                                onClick={() => handleSort('title')}
                                className="flex items-center gap-1 text-left text-white/80 font-medium hover:text-white transition-colors"
                            >
                                Title
                                <ArrowUpDown size={14} className={sortField === 'title' ? 'text-blue-400' : 'text-white/40'} />
                            </button>
                            <button
                                onClick={() => handleSort('task')}
                                className="flex items-center gap-1 text-left text-white/80 font-medium hover:text-white transition-colors"
                            >
                                Task
                                <ArrowUpDown size={14} className={sortField === 'task' ? 'text-blue-400' : 'text-white/40'} />
                            </button>
                            <button
                                onClick={() => handleSort('created_at')}
                                className="flex items-center gap-1 text-white/80 font-medium hover:text-white transition-colors"
                            >
                                Created
                                <ArrowUpDown size={14} className={sortField === 'created_at' ? 'text-blue-400' : 'text-white/40'} />
                            </button>
                            <div className="text-white/80 font-medium text-center">Actions</div>
                        </div>

                        {/* Table Body */}
                        {paginatedDrills.length === 0 ? (
                            <div className="text-white/60 text-center py-8">
                                No drills found matching your criteria.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {paginatedDrills.map((drill) => (
                                    <DrillRow
                                        key={drill.id}
                                        drill={drill}
                                        isExpanded={expandedIds.has(drill.id)}
                                        isSelected={selectedIds.has(drill.id)}
                                        onToggleExpand={() => toggleExpand(drill.id)}
                                        onToggleSelect={() => toggleSelect(drill.id)}
                                        onEdit={() => setEditingDrill(drill)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                            <div className="text-white/60 text-sm">
                                Page {currentPage} of {totalPages}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="flex items-center gap-1 px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={16} />
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
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
            {editingDrill && (
                <DrillEditModal
                    drill={editingDrill}
                    issues={issues}
                    onClose={() => setEditingDrill(null)}
                    onSave={() => {
                        setEditingDrill(null);
                        refetch();
                    }}
                />
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <DrillEditModal
                    drill={null}
                    issues={issues}
                    onClose={() => setShowCreateModal(false)}
                    onSave={() => {
                        setShowCreateModal(false);
                        refetch();
                    }}
                />
            )}
        </div>
    );
}

// Drill Row Component
interface DrillRowProps {
    drill: Drill;
    isExpanded: boolean;
    isSelected: boolean;
    onToggleExpand: () => void;
    onToggleSelect: () => void;
    onEdit: () => void;
}

function DrillRow({ drill, isExpanded, isSelected, onToggleExpand, onToggleSelect, onEdit }: DrillRowProps) {
    return (
        <div className={`border border-white/5 rounded-lg overflow-hidden ${isSelected ? 'bg-blue-500/10 border-blue-500/20' : 'bg-[#0b1020]/50'}`}>
            {/* Main Row */}
            <div className="grid grid-cols-1 sm:grid-cols-[auto_2fr_3fr_auto_auto] gap-2 sm:gap-4 p-3 sm:p-4 items-center">
                {/* Checkbox - Hidden on mobile */}
                <div className="hidden sm:flex items-center">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={onToggleSelect}
                        className="w-4 h-4 rounded bg-[#0b1020] border-white/20"
                    />
                </div>

                {/* Title */}
                <div className="flex items-center justify-between sm:justify-start gap-2">
                    <span className="text-white font-medium">{drill.title}</span>
                    {/* Mobile expand button */}
                    <button
                        onClick={onToggleExpand}
                        className="sm:hidden p-1 hover:bg-white/10 rounded transition-colors"
                    >
                        {isExpanded ? (
                            <ChevronUp size={18} className="text-white/60" />
                        ) : (
                            <ChevronDown size={18} className="text-white/60" />
                        )}
                    </button>
                </div>

                {/* Task */}
                <div className="text-white/70 text-sm line-clamp-2">
                    {drill.task}
                </div>

                {/* Created Date */}
                <div className="hidden sm:block text-white/60 text-sm whitespace-nowrap">
                    {new Date(drill.created_at).toLocaleDateString()}
                </div>

                {/* Actions */}
                <div className="hidden sm:flex items-center gap-2">
                    <button
                        onClick={onToggleExpand}
                        className="p-2 hover:bg-white/10 rounded transition-colors"
                        title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                        {isExpanded ? (
                            <ChevronUp size={18} className="text-white/60" />
                        ) : (
                            <ChevronDown size={18} className="text-white/60" />
                        )}
                    </button>
                    <button
                        onClick={onEdit}
                        className="p-2 hover:bg-blue-500/20 rounded transition-colors"
                        title="Edit"
                    >
                        <Edit size={18} className="text-blue-400" />
                    </button>
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-4">
                    {/* Success Signal */}
                    <div>
                        <label className="text-white/50 text-xs font-medium uppercase tracking-wide mb-1 block">
                            Success Signal
                        </label>
                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <p className="text-green-300 text-sm">{drill.success_signal || 'Not specified'}</p>
                        </div>
                    </div>

                    {/* Fault Indicator */}
                    <div>
                        <label className="text-white/50 text-xs font-medium uppercase tracking-wide mb-1 block">
                            Fault Indicator
                        </label>
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-red-300 text-sm">{drill.fault_indicator || 'Not specified'}</p>
                        </div>
                    </div>

                    {/* Mobile Actions */}
                    <div className="flex gap-2 sm:hidden pt-2">
                        <button
                            onClick={onToggleSelect}
                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                isSelected 
                                    ? 'bg-blue-500/30 border border-blue-500/40 text-white' 
                                    : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                            }`}
                        >
                            <CheckCircle size={16} />
                            {isSelected ? 'Selected' : 'Select'}
                        </button>
                        <button
                            onClick={onEdit}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-white text-sm transition-colors"
                        >
                            <Edit size={16} />
                            Edit
                        </button>
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-wrap gap-4 pt-2 border-t border-white/5 text-xs text-white/40">
                        <span>ID: {drill.id.substring(0, 8)}...</span>
                        <span>Created: {new Date(drill.created_at).toLocaleString()}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
