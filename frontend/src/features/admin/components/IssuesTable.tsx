import type { Issue } from '@/features/issues/types';

interface IssuesTableProps {
    issues: Issue[];
}

export default function IssuesTable({ issues }: IssuesTableProps) {
    if (issues.length === 0) {
        return (
            <div className="text-white/60 text-center py-8">
                No issues found in the database.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
                <thead>
                    <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-white/80 font-medium">Title</th>
                        <th className="text-left py-3 px-4 text-white/80 font-medium">Phase</th>
                        <th className="text-left py-3 px-4 text-white/80 font-medium">Current Motion</th>
                        {/* <th className="text-left py-3 px-4 text-white/80 font-medium">Expected Motion</th>
                        <th className="text-left py-3 px-4 text-white/80 font-medium">Swing Effect</th>
                        <th className="text-left py-3 px-4 text-white/80 font-medium">Shot Outcome</th> */}
                    </tr>
                </thead>
                <tbody>
                    {issues.map((issue) => (
                        <tr 
                            key={issue.id}
                            className="border-b border-white/5 hover:bg-white/5 transition-colors text-left"
                        >
                            <td className="py-3 px-4 text-white">{issue.title}</td>
                            <td className="py-3 px-4 text-white/70">
                                {issue.phase || '-'}
                            </td>
                            <td className="py-3 px-4 text-white/70 max-w-xs truncate">
                                {issue.current_motion || '-'}
                            </td>
                            {/* <td className="py-3 px-4 text-white/70 max-w-xs truncate">
                                {issue.expected_motion || '-'}
                            </td>
                            <td className="py-3 px-4 text-white/70 max-w-xs truncate">
                                {issue.swing_effect || '-'}
                            </td>
                            <td className="py-3 px-4 text-white/70 max-w-xs truncate">
                                {issue.shot_outcome || '-'}
                            </td> */}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
