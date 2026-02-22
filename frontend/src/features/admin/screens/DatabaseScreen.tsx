import { useAdminData } from '../hooks/useAdminData';
import IssuesTable from '../components/IssuesTable';
import DrillsTable from '../components/DrillsTable';
import { RefreshCw } from 'lucide-react';

export default function DatabaseScreen() {
    const { issues, drills, loading, error, refetch } = useAdminData();

    if (loading) {
        return (
            <div className="justify-center p-10">
                <div className="text-3xl font-bold mb-6 text-white ml-6">Database Administration</div>
                <div className="ml-6 mt-8">
                    <div className="bg-[#0e1428]/80 backdrop-blur-md border border-white/10 rounded-lg p-6">
                        <p className="text-white/60">Loading database content...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="justify-center p-10">
                <div className="text-3xl font-bold mb-6 text-white ml-6">Database Administration</div>
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
            <div className="flex items-center justify-between mb-6 ml-6 mr-6">
                <h1 className="text-3xl font-bold text-white">Database Administration</h1>
                <button
                    onClick={refetch}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-white transition-colors"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>
            
            {/* Issues Section */}
            <div className="mx-2 sm:mx-6 mt-8">
                <div className="bg-[#0e1428]/80 backdrop-blur-md border border-white/10 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-white">
                            All Issues
                        </h2>
                        <span className="text-white/60 text-sm">
                            {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
                        </span>
                    </div>
                    <IssuesTable issues={issues} />
                </div>
            </div>

            {/* Drills Section */}
            <div className="mx-2 sm:mx-6 mt-8">
                <div className="bg-[#0e1428]/80 backdrop-blur-md border border-white/10 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-white">
                            All Drills
                        </h2>
                        <span className="text-white/60 text-sm">
                            {drills.length} {drills.length === 1 ? 'drill' : 'drills'}
                        </span>
                    </div>
                    <DrillsTable drills={drills} />
                </div>
            </div>
        </div>
    );
}
