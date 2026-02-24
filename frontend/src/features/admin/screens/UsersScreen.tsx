import { useState, useMemo } from 'react';
import { 
    RefreshCw, 
    Search, 
    Filter,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    Eye,
    User,
    AlertTriangle
} from 'lucide-react';
import UserDetailModal from '../components/UserDetailModal';

// ============================================================================
// MOCK DATA - This is placeholder data until API support is implemented
// ============================================================================

interface MockUser {
    id: string;
    email: string;
    name: string | null;
    created_at: string;
    last_sign_in: string | null;
    role: 'user' | 'admin' | 'pro';
    status: 'active' | 'disabled' | 'banned';
    auth_provider: 'email' | 'google' | 'apple';
    supabase_uid: string;
    analyses_count: number;
    drills_completed: number;
}

// Generate mock users
const MOCK_USERS: MockUser[] = [
    {
        id: '1',
        email: 'john.golfer@example.com',
        name: 'John Golfer',
        created_at: '2026-01-15T10:30:00Z',
        last_sign_in: '2026-02-24T08:15:00Z',
        role: 'pro',
        status: 'active',
        auth_provider: 'google',
        supabase_uid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        analyses_count: 45,
        drills_completed: 120,
    },
    {
        id: '2',
        email: 'jane.smith@example.com',
        name: 'Jane Smith',
        created_at: '2026-01-20T14:00:00Z',
        last_sign_in: '2026-02-23T16:45:00Z',
        role: 'user',
        status: 'active',
        auth_provider: 'email',
        supabase_uid: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
        analyses_count: 12,
        drills_completed: 34,
    },
    {
        id: '3',
        email: 'admin@trueswing.com',
        name: 'Admin User',
        created_at: '2026-01-01T00:00:00Z',
        last_sign_in: '2026-02-24T09:00:00Z',
        role: 'admin',
        status: 'active',
        auth_provider: 'email',
        supabase_uid: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
        analyses_count: 0,
        drills_completed: 0,
    },
    {
        id: '4',
        email: 'mike.wilson@example.com',
        name: 'Mike Wilson',
        created_at: '2026-02-01T09:00:00Z',
        last_sign_in: '2026-02-20T11:30:00Z',
        role: 'user',
        status: 'active',
        auth_provider: 'apple',
        supabase_uid: 'd4e5f6a7-b8c9-0123-defa-456789012345',
        analyses_count: 8,
        drills_completed: 22,
    },
    {
        id: '5',
        email: 'suspended.user@example.com',
        name: 'Suspended User',
        created_at: '2026-01-25T13:00:00Z',
        last_sign_in: '2026-02-10T14:00:00Z',
        role: 'user',
        status: 'disabled',
        auth_provider: 'email',
        supabase_uid: 'e5f6a7b8-c9d0-1234-efab-567890123456',
        analyses_count: 3,
        drills_completed: 5,
    },
    {
        id: '6',
        email: 'banned.spammer@example.com',
        name: null,
        created_at: '2026-02-05T08:00:00Z',
        last_sign_in: '2026-02-06T10:00:00Z',
        role: 'user',
        status: 'banned',
        auth_provider: 'email',
        supabase_uid: 'f6a7b8c9-d0e1-2345-fabc-678901234567',
        analyses_count: 0,
        drills_completed: 0,
    },
    {
        id: '7',
        email: 'sarah.jones@example.com',
        name: 'Sarah Jones',
        created_at: '2026-02-10T16:00:00Z',
        last_sign_in: '2026-02-24T07:00:00Z',
        role: 'pro',
        status: 'active',
        auth_provider: 'google',
        supabase_uid: 'a7b8c9d0-e1f2-3456-abcd-789012345678',
        analyses_count: 67,
        drills_completed: 189,
    },
    {
        id: '8',
        email: 'tom.beginner@example.com',
        name: 'Tom Beginner',
        created_at: '2026-02-20T10:00:00Z',
        last_sign_in: null,
        role: 'user',
        status: 'active',
        auth_provider: 'email',
        supabase_uid: 'b8c9d0e1-f2a3-4567-bcde-890123456789',
        analyses_count: 0,
        drills_completed: 0,
    },
    {
        id: '9',
        email: 'david.pro@example.com',
        name: 'David Professional',
        created_at: '2026-01-18T11:00:00Z',
        last_sign_in: '2026-02-22T18:30:00Z',
        role: 'pro',
        status: 'active',
        auth_provider: 'apple',
        supabase_uid: 'c9d0e1f2-a3b4-5678-cdef-901234567890',
        analyses_count: 89,
        drills_completed: 245,
    },
    {
        id: '10',
        email: 'lisa.casual@example.com',
        name: 'Lisa Casual',
        created_at: '2026-02-15T15:00:00Z',
        last_sign_in: '2026-02-19T12:00:00Z',
        role: 'user',
        status: 'active',
        auth_provider: 'google',
        supabase_uid: 'd0e1f2a3-b4c5-6789-defa-012345678901',
        analyses_count: 5,
        drills_completed: 15,
    },
];

// ============================================================================

type SortField = 'email' | 'name' | 'created_at' | 'last_sign_in' | 'role' | 'status';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

export default function UsersScreen() {
    // Search and filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);
    
    // Sort state
    const [sortField, setSortField] = useState<SortField>('created_at');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    
    // Detail modal state
    const [selectedUser, setSelectedUser] = useState<MockUser | null>(null);

    // Filter and sort users
    const filteredAndSortedUsers = useMemo(() => {
        let result = [...MOCK_USERS];

        // Apply search filter (email exact or partial, name partial)
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(user =>
                user.email.toLowerCase().includes(lowerSearch) ||
                (user.name && user.name.toLowerCase().includes(lowerSearch))
            );
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            result = result.filter(user => user.status === statusFilter);
        }

        // Apply role filter
        if (roleFilter !== 'all') {
            result = result.filter(user => user.role === roleFilter);
        }

        // Apply sorting
        result.sort((a, b) => {
            let comparison = 0;
            switch (sortField) {
                case 'email':
                    comparison = a.email.localeCompare(b.email);
                    break;
                case 'name':
                    comparison = (a.name || '').localeCompare(b.name || '');
                    break;
                case 'role':
                    comparison = a.role.localeCompare(b.role);
                    break;
                case 'status':
                    comparison = a.status.localeCompare(b.status);
                    break;
                case 'created_at':
                    comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                    break;
                case 'last_sign_in':
                    const aTime = a.last_sign_in ? new Date(a.last_sign_in).getTime() : 0;
                    const bTime = b.last_sign_in ? new Date(b.last_sign_in).getTime() : 0;
                    comparison = aTime - bTime;
                    break;
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [searchTerm, statusFilter, roleFilter, sortField, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedUsers.length / ITEMS_PER_PAGE);
    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredAndSortedUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredAndSortedUsers, currentPage]);

    // Reset to page 1 when filters change
    const handleSearch = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const handleStatusFilter = (value: string) => {
        setStatusFilter(value);
        setCurrentPage(1);
    };

    const handleRoleFilter = (value: string) => {
        setRoleFilter(value);
        setCurrentPage(1);
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

    // Get status badge styling
    const getStatusBadge = (status: MockUser['status']) => {
        switch (status) {
            case 'active':
                return 'bg-green-500/20 border-green-500/30 text-green-400';
            case 'disabled':
                return 'bg-amber-500/20 border-amber-500/30 text-amber-400';
            case 'banned':
                return 'bg-red-500/20 border-red-500/30 text-red-400';
        }
    };

    // Get role badge styling
    const getRoleBadge = (role: MockUser['role']) => {
        switch (role) {
            case 'admin':
                return 'bg-purple-500/20 border-purple-500/30 text-purple-400';
            case 'pro':
                return 'bg-blue-500/20 border-blue-500/30 text-blue-400';
            case 'user':
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
                    onClick={() => {/* No-op for mock data */}}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-white transition-colors"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {/* Mock Data Warning */}
            <div className="mx-2 sm:mx-6 mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-400 flex-shrink-0" />
                <span className="text-amber-400 text-sm">
                    <strong>Mock Data:</strong> This page displays placeholder data. API integration is not yet implemented.
                </span>
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
                                placeholder="Search by email or name..."
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
                                        onChange={(e) => handleStatusFilter(e.target.value)}
                                        className="px-3 py-2 bg-[#0e1428] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="active">Active</option>
                                        <option value="disabled">Disabled</option>
                                        <option value="banned">Banned</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-white/60 text-sm block mb-1">Role</label>
                                    <select
                                        value={roleFilter}
                                        onChange={(e) => handleRoleFilter(e.target.value)}
                                        className="px-3 py-2 bg-[#0e1428] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
                                    >
                                        <option value="all">All Roles</option>
                                        <option value="admin">Admin</option>
                                        <option value="pro">Pro</option>
                                        <option value="user">User</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Results count */}
                    <div className="mb-2 text-white/60 text-sm">
                        Showing {paginatedUsers.length} of {filteredAndSortedUsers.length} users
                    </div>

                    {/* Table */}
                    <div className="w-full overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-3 px-3">
                                        <button
                                            onClick={() => handleSort('email')}
                                            className="flex items-center gap-1 text-white/80 font-medium hover:text-white transition-colors"
                                        >
                                            Email
                                            <ArrowUpDown size={14} className={sortField === 'email' ? 'text-blue-400' : 'text-white/40'} />
                                        </button>
                                    </th>
                                    <th className="text-left py-3 px-3">
                                        <button
                                            onClick={() => handleSort('name')}
                                            className="flex items-center gap-1 text-white/80 font-medium hover:text-white transition-colors"
                                        >
                                            Name
                                            <ArrowUpDown size={14} className={sortField === 'name' ? 'text-blue-400' : 'text-white/40'} />
                                        </button>
                                    </th>
                                    <th className="text-left py-3 px-3">
                                        <button
                                            onClick={() => handleSort('role')}
                                            className="flex items-center gap-1 text-white/80 font-medium hover:text-white transition-colors"
                                        >
                                            Role
                                            <ArrowUpDown size={14} className={sortField === 'role' ? 'text-blue-400' : 'text-white/40'} />
                                        </button>
                                    </th>
                                    <th className="text-left py-3 px-3">
                                        <button
                                            onClick={() => handleSort('status')}
                                            className="flex items-center gap-1 text-white/80 font-medium hover:text-white transition-colors"
                                        >
                                            Status
                                            <ArrowUpDown size={14} className={sortField === 'status' ? 'text-blue-400' : 'text-white/40'} />
                                        </button>
                                    </th>
                                    <th className="text-left py-3 px-3">
                                        <button
                                            onClick={() => handleSort('created_at')}
                                            className="flex items-center gap-1 text-white/80 font-medium hover:text-white transition-colors"
                                        >
                                            Created
                                            <ArrowUpDown size={14} className={sortField === 'created_at' ? 'text-blue-400' : 'text-white/40'} />
                                        </button>
                                    </th>
                                    <th className="text-left py-3 px-3">
                                        <button
                                            onClick={() => handleSort('last_sign_in')}
                                            className="flex items-center gap-1 text-white/80 font-medium hover:text-white transition-colors"
                                        >
                                            Last Sign-in
                                            <ArrowUpDown size={14} className={sortField === 'last_sign_in' ? 'text-blue-400' : 'text-white/40'} />
                                        </button>
                                    </th>
                                    <th className="text-center py-3 px-3 text-white/80 font-medium">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-white/60 text-center py-8">
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
                                                <span className={`px-2 py-1 rounded text-xs border ${getStatusBadge(user.status)}`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 text-white/60 text-sm whitespace-nowrap">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="py-3 px-3 text-white/60 text-sm whitespace-nowrap">
                                                {user.last_sign_in 
                                                    ? new Date(user.last_sign_in).toLocaleDateString()
                                                    : <span className="text-white/40 italic">Never</span>
                                                }
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

// Export the MockUser type for the modal
export type { MockUser };
