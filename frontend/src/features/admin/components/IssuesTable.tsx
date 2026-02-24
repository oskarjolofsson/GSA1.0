import { useState } from 'react';
import type { Issue } from '@/features/issues/types';
import { Search } from 'lucide-react';

interface IssuesTableProps {
    issues: Issue[];
}

export default function IssuesTable({ issues }: IssuesTableProps) {
    const [searchTerm, setSearchTerm] = useState('');

    // Filter issues based on search term
    const filteredIssues = issues.filter(issue => 
        issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.phase?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.current_motion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.expected_motion?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (issues.length === 0) {
        return (
            <div className="text-white/60 text-center py-8">
                No issues found in the database.
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
                        placeholder="Search issues by title, phase, or motion..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-[#0b1020] border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                </div>
            </div>

            {/* Results count */}
            {searchTerm && (
                <div className="mb-2 text-white/60 text-sm">
                    Found {filteredIssues.length} of {issues.length} issues
                </div>
            )}

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
                    {filteredIssues.map((issue) => (
                        <tr 
                            key={issue.id}
                            className="border-b border-white/5 hover:bg-white/10 transition-colors text-left cursor-pointer"
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

        
        </>
    );
}
