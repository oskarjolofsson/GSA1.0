import { useState } from 'react';
import type { Drill } from '@/features/drills/types';
import { Search } from 'lucide-react';

interface DrillsTableProps {
    drills: Drill[];
}

export default function DrillsTable({ drills }: DrillsTableProps) {
    const [searchTerm, setSearchTerm] = useState('');

    // Filter drills based on search term
    const filteredDrills = drills.filter(drill => 
        drill.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drill.task.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drill.success_signal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drill.fault_indicator.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (drills.length === 0) {
        return (
            <div className="text-white/60 text-center py-8">
                No drills found in the database.
            </div>
        );
    }

    return (
        <>
            {/* Search Input */}
            <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" size={20} />
                    <input
                        type="text"
                        placeholder="Search drills by title, task, or signals..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-[#0b1020] border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                </div>
            </div>

            {/* Results count */}
            {searchTerm && (
                <div className="mb-2 text-white/60 text-sm">
                    Found {filteredDrills.length} of {drills.length} drills
                </div>
            )}

            <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-white/80 font-medium">Title</th>
                        <th className="text-left py-3 px-4 text-white/80 font-medium">Task</th>
                        <th className="text-left py-3 px-4 text-white/80 font-medium">Success Signal</th>
                        <th className="text-left py-3 px-4 text-white/80 font-medium">Fault Indicator</th>
                        <th className="text-left py-3 px-4 text-white/80 font-medium">Created</th>
                        <th className="text-left py-3 px-4 text-white/80 font-medium">ID</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredDrills.map((drill) => (
                        <tr 
                            key={drill.id}
                            className="border-b border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                        >
                            <td className="py-3 px-4 text-white">{drill.title}</td>
                            <td className="py-3 px-4 text-white/70 max-w-xs truncate">
                                {drill.task}
                            </td>
                            <td className="py-3 px-4 text-white/70 max-w-xs truncate">
                                {drill.success_signal}
                            </td>
                            <td className="py-3 px-4 text-white/70 max-w-xs truncate">
                                {drill.fault_indicator}
                            </td>
                            <td className="py-3 px-4 text-white/60 text-sm">
                                {new Date(drill.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-white/40 text-xs font-mono">
                                {drill.id.substring(0, 8)}...
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        </>
    );
}
