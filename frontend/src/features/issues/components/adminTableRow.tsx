import {
    ChevronDown, ChevronUp, CheckCircle, Edit
} from 'lucide-react';
import { Issue } from '../types';

// Issue Row Component
interface IssueRowProps {
    issue: Issue;
    isExpanded: boolean;
    isSelected: boolean;
    onToggleExpand: () => void;
    onToggleSelect: () => void;
    onEdit: () => void;
}

export function IssueRow({ issue, isExpanded, isSelected, onToggleExpand, onToggleSelect, onEdit }: IssueRowProps) {
    return (
        <div className={`border border-white/5 rounded-lg overflow-hidden ${isSelected ? 'bg-blue-500/10 border-blue-500/20' : 'bg-[#0b1020]/50'}`}>
            {/* Main Row */}
            <div className="grid grid-cols-1 sm:grid-cols-[auto_2fr_1fr_auto_auto] gap-2 sm:gap-4 p-3 sm:p-4 items-center">
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
                    <span className="text-white font-medium">{issue.title}</span>
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

                {/* Phase */}
                <div>
                    {issue.phase ? (
                        <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-purple-300 text-sm">
                            {issue.phase}
                        </span>
                    ) : (
                        <span className="text-white/40 text-sm italic">No phase</span>
                    )}
                </div>

                {/* Created Date */}
                <div className="hidden sm:block text-white/60 text-sm whitespace-nowrap">
                    {new Date(issue.created_at).toLocaleDateString()}
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

                    {/* Description */}
                    <div>
                        <label className="text-white/50 text-xs font-medium uppercase tracking-wide mb-1 block">
                            Description
                        </label>
                        <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                            <p className="text-white/70 text-sm whitespace-pre-wrap">{issue.description || 'No description provided.'}</p>
                        </div>
                    </div>

                    {/* Current Motion */}
                    <div>
                        <label className="text-white/50 text-xs font-medium uppercase tracking-wide mb-1 block">
                            Current Motion
                        </label>
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                            <p className="text-amber-300 text-sm">{issue.current_motion || 'Not specified'}</p>
                        </div>
                    </div>


                    {/* Expected Motion */}
                    <div>
                        <label className="text-white/50 text-xs font-medium uppercase tracking-wide mb-1 block">
                            Expected Motion
                        </label>
                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <p className="text-green-300 text-sm">{issue.expected_motion || 'Not specified'}</p>
                        </div>
                    </div>

                    {/* Swing Effect */}
                    <div>
                        <label className="text-white/50 text-xs font-medium uppercase tracking-wide mb-1 block">
                            Swing Effect
                        </label>
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <p className="text-blue-300 text-sm">{issue.swing_effect || 'Not specified'}</p>
                        </div>
                    </div>

                    {/* Shot Outcome */}
                    <div>
                        <label className="text-white/50 text-xs font-medium uppercase tracking-wide mb-1 block">
                            Shot Outcome
                        </label>
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-red-300 text-sm">{issue.shot_outcome || 'Not specified'}</p>
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
                        <span>ID: {issue.id.substring(0, 8)}...</span>
                        <span>Created: {new Date(issue.created_at).toLocaleString()}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
