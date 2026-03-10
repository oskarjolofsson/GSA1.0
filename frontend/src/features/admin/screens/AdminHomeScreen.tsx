import { Link } from 'react-router-dom';
import { 
    Database, 
    AlertTriangle, 
    Users, 
    Plus,
    Link2,
    Loader2,
    RefreshCw
} from 'lucide-react';
import { useAdminStats } from '../hooks/useAdminStats';
import { ErrorState, LoadingState } from '../../../shared/components/cards/error';

interface StatCardProps {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    variant?: 'default' | 'warning';
}

function StatCard({ label, value, icon, variant = 'default' }: StatCardProps) {
    const borderColor = variant === 'warning' ? 'border-amber-500/30' : 'border-white/10';
    const iconColor = variant === 'warning' ? 'text-amber-400' : 'text-blue-400';
    
    return (
        <div className={`bg-[#0e1428]/80 backdrop-blur-md border ${borderColor} rounded-lg p-4`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-white/60 text-sm">{label}</p>
                    <p className="text-2xl font-bold text-white mt-1">{value}</p>
                </div>
                <div className={`${iconColor}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

interface QuickActionProps {
    label: string;
    icon: React.ReactNode;
    onClick?: () => void;
}

function QuickAction({ label, icon, onClick }: QuickActionProps) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-3 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-white transition-colors w-full"
        >
            {icon}
            <span className="font-medium">{label}</span>
        </button>
    );
}

export default function AdminHomeScreen() {
    const { stats, loading, error, refetch } = useAdminStats();

    const handleCreateDrill = () => {
        // TODO: Implement create drill modal/navigation
        console.log('Create drill');
    };

    const handleCreateIssue = () => {
        // TODO: Implement create issue modal/navigation
        console.log('Create issue');
    };

    const handleCreateMapping = () => {
        // TODO: Implement create mapping modal/navigation
        console.log('Create mapping');
    };

    if (loading) {
        return <LoadingState title="Drills Management" message="Loading drills..." />;
    }

    if (error) {
        return (
            <ErrorState
                title="Drills Management"
                error={error}
                onRetry={refetch}
            />
        );
    }

    return (
        <div className="justify-center p-2 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 ml-6 mr-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                    <button
                        onClick={refetch}
                        disabled={loading}
                        className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/60 hover:text-white transition-colors disabled:opacity-50"
                        title="Refresh stats"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
                <Link
                    to="/admin/database"
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/80 hover:text-white transition-colors"
                >
                    <Database size={16} />
                    View Database
                </Link>
            </div>

            {/* Error State */}
            {error && (
                <div className="mx-2 sm:mx-6 mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300">
                    Failed to load statistics. Please try again.
                </div>
            )}

            {/* Loading State */}
            {loading && !stats.totalDrills && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-blue-400" />
                </div>
            )}

            {/* Stats Grid */}
            <div className="mx-2 sm:mx-6">
                <h2 className="text-lg font-semibold text-white/80 mb-4">Overview</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard 
                        label="Total Drills" 
                        value={stats.totalDrills} 
                        icon={<Database size={24} />} 
                    />
                    <StatCard 
                        label="Total Issues" 
                        value={stats.totalIssues} 
                        icon={<AlertTriangle size={24} />} 
                    />
                    <StatCard 
                        label="Total Mappings" 
                        value={stats.totalMappings} 
                        icon={<Link2 size={24} />} 
                    />
                    <StatCard 
                        label="Total Users" 
                        value={stats.totalUsers} 
                        icon={<Users size={24} />} 
                    />
                </div>
            </div>

            {/* Warnings / Maintenance Stats */}
            <div className="mx-2 sm:mx-6 mt-6">
                <h2 className="text-lg font-semibold text-white/80 mb-4">Needs Attention</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard 
                        label="Unmapped Drills" 
                        value={stats.unmappedDrills} 
                        icon={<AlertTriangle size={24} />}
                        variant="warning"
                    />
                    <StatCard 
                        label="Issues with No Drills" 
                        value={stats.issuesWithNoDrills} 
                        icon={<AlertTriangle size={24} />}
                        variant="warning"
                    />
                    <StatCard 
                        label="New Users (7 days)" 
                        value={stats.newUsersLast7Days} 
                        icon={<Users size={24} />} 
                    />
                    <StatCard 
                        label="New Users (30 days)" 
                        value={stats.newUsersLast30Days} 
                        icon={<Users size={24} />} 
                    />
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mx-2 sm:mx-6 mt-8">
                <div className="bg-[#0e1428]/80 backdrop-blur-md border border-white/10 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <QuickAction 
                            label="Create Drill" 
                            icon={<Plus size={20} />}
                            onClick={handleCreateDrill}
                        />
                        <QuickAction 
                            label="Create Issue" 
                            icon={<Plus size={20} />}
                            onClick={handleCreateIssue}
                        />
                        <QuickAction 
                            label="Create Mapping" 
                            icon={<Link2 size={20} />}
                            onClick={handleCreateMapping}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
