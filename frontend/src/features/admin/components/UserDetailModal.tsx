import { X, Mail, User, Calendar, Clock, Shield, Activity, LogIn } from 'lucide-react';
import type { DbUser } from '../types';

interface UserDetailModalProps {
    user: DbUser;
    onClose: () => void;
}

export default function UserDetailModal({ user, onClose }: UserDetailModalProps) {
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

    // Get auth provider icon/label
    const getAuthProviderLabel = (provider?: DbUser['authProvider']) => {
        switch (provider) {
            case 'email':
                return 'Email/Password';
            case 'google':
                return 'Google OAuth';
            case 'apple':
                return 'Apple ID';
            default:
                return 'N/A';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#0e1428] border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                            <User size={24} className="text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white">
                                {user.name || 'Unnamed User'}
                            </h2>
                            <p className="text-white/60 text-sm">{user.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-white/60" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {/* Active Status and Role */}
                    <div className="flex gap-3 mb-6">
                        <span className={`px-3 py-1 rounded-lg text-sm border ${getActiveBadge(user.active)}`}>
                            {user.active === true ? 'Active' : user.active === false ? 'Inactive' : 'N/A'}
                        </span>
                        <span className={`px-3 py-1 rounded-lg text-sm border ${getRoleBadge(user.role)}`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                    </div>

                    {/* Profile Section */}
                    <section className="mb-6">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <User size={18} className="text-blue-400" />
                            Profile Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InfoRow icon={<Mail size={16} />} label="Email" value={user.email} />
                            <InfoRow icon={<User size={16} />} label="Display Name" value={user.name || 'Not set'} />
                        </div>
                    </section>

                    {/* Auth Section */}
                    <section className="mb-6">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <Shield size={18} className="text-purple-400" />
                            Authentication
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InfoRow 
                                icon={<LogIn size={16} />} 
                                label="Auth Provider" 
                                value={getAuthProviderLabel(user.authProvider)} 
                            />
                        </div>
                    </section>

                    {/* Timestamps Section */}
                    <section className="mb-6">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <Calendar size={18} className="text-green-400" />
                            Timestamps
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InfoRow 
                                icon={<Calendar size={16} />} 
                                label="Account Created" 
                                value={user.createdAt 
                                    ? new Date(user.createdAt).toLocaleString()
                                    : 'N/A'
                                } 
                            />
                            <InfoRow 
                                icon={<Clock size={16} />} 
                                label="Last Sign-in" 
                                value={user.lastSignIn 
                                    ? new Date(user.lastSignIn).toLocaleString() 
                                    : 'Never'
                                } 
                            />
                        </div>
                    </section>

                    {/* Activity Section */}
                    <section className="mb-6">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <Activity size={18} className="text-amber-400" />
                            Usage Statistics
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <StatCard label="Analyses" value={user.analysesCount ?? 0} />
                            <StatCard label="Drills Completed" value={user.drillsCompleted ?? 0} />
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// Helper component for info rows
function InfoRow({ 
    icon, 
    label, 
    value 
}: { 
    icon: React.ReactNode; 
    label: string; 
    value: React.ReactNode;
}) {
    return (
        <div className="bg-[#0b1020] border border-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 text-white/40 text-xs mb-1">
                {icon}
                {label}
            </div>
            <div className="text-white">{value}</div>
        </div>
    );
}

// Helper component for stat cards
function StatCard({ label, value }: { label: string; value: number | string }) {
    return (
        <div className="bg-[#0b1020] border border-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-white/60 text-sm">{label}</div>
        </div>
    );
}
