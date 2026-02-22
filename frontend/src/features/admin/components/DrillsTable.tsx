import type { Drill } from '@/features/drills/types';

interface DrillsTableProps {
    drills: Drill[];
}

export default function DrillsTable({ drills }: DrillsTableProps) {
    if (drills.length === 0) {
        return (
            <div className="text-white/60 text-center py-8">
                No drills found in the database.
            </div>
        );
    }

    return (
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
                    {drills.map((drill) => (
                        <tr 
                            key={drill.id}
                            className="border-b border-white/5 hover:bg-white/5 transition-colors"
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
    );
}
