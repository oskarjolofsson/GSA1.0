import { 
    RefreshCw, 
    ArrowUpDown,
    Eye,
    User
} from 'lucide-react';
import UserDetailModal from '../components/UserDetailModal';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import FilterSelect from '../components/FilterSelect';
import Pagination from '../components/Pagination';
import { useUserTable, STATUS_OPTIONS, ROLE_OPTIONS, type SortField } from '../hooks/useUserTable';

export default function UsersScreen() {
    const {
        paginatedUsers,
        filteredCount,
        searchTerm,
        activeFilter,
        roleFilter,
        showFilters,
        sortField,
        currentPage,
        totalPages,
        handleSearch,
        handleActiveFilter,
        handleRoleFilter,
        toggleFilters,
        handleSort,
        handlePageChange,
        selectedUser,
        setSelectedUser,
    } = useUserTable();

    // Get active badge styling
    const getActiveBadge = (active?: boolean) => {
        if (active === true) {
            return 'bg-green-500/20 border-green-500/30 text-green-400';
        } else if (active === false) {
            return 'bg-amber-500/20 border-amber-500/30 text-amber-400';
        }
        return 'bg-white/10 border-white/20 text-white/60';
    };

    // Get role badge styling
    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin':
                return 'bg-purple-500/20 border-purple-500/30 text-purple-400';
            case 'pro':
                return 'bg-blue-500/20 border-blue-500/30 text-blue-400';
            case 'user':
            default:
                return 'bg-white/10 border-white/20 text-white/60';
        }
    };

    return (
        <div className="justify-center p-2 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 mx-2 sm:mx-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <User className="text-blue-400" size={32} />
                        Users Management
                    </h1>
                    <p className="text-white/60 mt-1">Search and inspect user accounts</p>
                </div>
                <button
                    onClick={() => {/* TODO: Implement refresh */}}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-white transition-colors"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {/* Main Content */}
            <div className="mx-2 sm:mx-6">
                <div className="bg-[#0e1428]/80 backdrop-blur-md border border-white/10 rounded-lg p-4 sm:p-6">
                    {/* Search and Filter Bar */}
                    <SearchBar
                        value={searchTerm}
                        onChange={handleSearch}
                        placeholder="Search by email or name..."
                        filterToggle={{ showFilters, onToggle: toggleFilters }}
                    />

                    {/* Expanded Filters */}
                    <FilterPanel show={showFilters}>
                        <FilterSelect
                            label="Status"
                            value={activeFilter}
                            onChange={handleActiveFilter}
                            options={STATUS_OPTIONS}
                        />
                        <FilterSelect
                            label="Role"
                            value={roleFilter}
                            onChange={handleRoleFilter}
                            options={ROLE_OPTIONS}
                        />
                    </FilterPanel>

                    {/* Results count */}
                    <div className="mb-2 text-white/60 text-sm">
                        Showing {paginatedUsers.length} of {filteredCount} users
                    </div>

                    {/* Table */}
                    <div className="w-full overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <SortableHeader field="email" label="Email" sortField={sortField} onSort={handleSort} />
                                    <SortableHeader field="name" label="Name" sortField={sortField} onSort={handleSort} />
                                    <SortableHeader field="role" label="Role" sortField={sortField} onSort={handleSort} />
                                    <th className="text-left py-3 px-3">
                                        <span className="text-white/80 font-medium">Active</span>
                                    </th>
                                    <th className="text-center py-3 px-3 text-white/80 font-medium">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-white/60 text-center py-8">
                                            No users found matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedUsers.map((user) => (
                                        <tr 
                                            key={user.id}
                                            className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                        >
                                            <td className="py-3 px-3">
                                                <span className="text-white">{user.email}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                {user.name ? (
                                                    <span className="text-white/80">{user.name}</span>
                                                ) : (
                                                    <span className="text-white/40 italic">No name</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className={`px-2 py-1 rounded text-xs border ${getRoleBadge(user.role)}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className={`px-2 py-1 rounded text-xs border ${getActiveBadge(user.active)}`}>
                                                    {user.active === true ? 'Active' : user.active === false ? 'Inactive' : 'N/A'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 text-center">
                                                <button
                                                    onClick={() => setSelectedUser(user)}
                                                    className="p-2 hover:bg-blue-500/20 rounded transition-colors"
                                                    title="View details"
                                                >
                                                    <Eye size={18} className="text-blue-400" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </div>
            </div>

            {/* User Detail Modal */}
            {selectedUser && (
                <UserDetailModal
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                />
            )}
        </div>
    );
}

// Helper component for sortable table headers
function SortableHeader({ 
    field, 
    label, 
    sortField, 
    onSort 
}: { 
    field: SortField; 
    label: string; 
    sortField: SortField; 
    onSort: (field: SortField) => void;
}) {
    return (
        <th className="text-left py-3 px-3">
            <button
                onClick={() => onSort(field)}
                className="flex items-center gap-1 text-white/80 font-medium hover:text-white transition-colors"
            >
                {label}
                <ArrowUpDown size={14} className={sortField === field ? 'text-blue-400' : 'text-white/40'} />
            </button>
        </th>
    );
}
