import { useState, useEffect } from 'react';
import type { Drill, CreateDrillRequest, UpdateDrillRequest } from '@/features/drills/types';
import type { Issue } from '@/features/issues/types';
import { X, Plus, Trash2, Link2, Save, AlertCircle } from 'lucide-react';
import drillService from '@/features/drills/services/drillService';

interface DrillEditModalProps {
    drill: Drill | null; // null for create mode
    issues: Issue[];
    onClose: () => void;
    onSave: () => void;
}

export default function DrillEditModal({ drill, issues, onClose, onSave }: DrillEditModalProps) {
    const isCreateMode = !drill;
    
    // Form state
    const [title, setTitle] = useState(drill?.title || '');
    const [task, setTask] = useState(drill?.task || '');
    const [successSignal, setSuccessSignal] = useState(drill?.success_signal || '');
    const [faultIndicator, setFaultIndicator] = useState(drill?.fault_indicator || '');
    
    // Linked issues state (placeholder - would need API support)
    const [linkedIssueIds, setLinkedIssueIds] = useState<string[]>([]);
    const [showIssueSelector, setShowIssueSelector] = useState(false);
    const [issueSearchTerm, setIssueSearchTerm] = useState('');
    
    // UI state
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter issues for selector
    const availableIssues = issues.filter(issue => 
        !linkedIssueIds.includes(issue.id) &&
        (issueSearchTerm === '' || 
         issue.title.toLowerCase().includes(issueSearchTerm.toLowerCase()))
    );

    const linkedIssues = issues.filter(issue => linkedIssueIds.includes(issue.id));

    // Load linked issues when editing (placeholder - would need API)
    useEffect(() => {
        if (drill) {
            // TODO: Fetch linked issues from API
            // For now, just mock it
            setLinkedIssueIds([]);
        }
    }, [drill]);

    const handleAddIssue = (issueId: string) => {
        setLinkedIssueIds(prev => [...prev, issueId]);
        setShowIssueSelector(false);
        setIssueSearchTerm('');
    };

    const handleRemoveIssue = (issueId: string) => {
        setLinkedIssueIds(prev => prev.filter(id => id !== issueId));
    };

    const handleSave = async () => {
        if (!title.trim()) {
            setError('Title is required');
            return;
        }
        if (!task.trim()) {
            setError('Task is required');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            if (isCreateMode) {
                const request: CreateDrillRequest = {
                    title: title.trim(),
                    task: task.trim(),
                    success_signal: successSignal.trim(),
                    fault_indicator: faultIndicator.trim(),
                };
                await drillService.createDrill(request);
            } else {
                const request: UpdateDrillRequest = {
                    title: title.trim(),
                    task: task.trim(),
                    success_signal: successSignal.trim(),
                    fault_indicator: faultIndicator.trim(),
                };
                await drillService.updateDrill(drill.id, request);
            }

            // TODO: Update linked issues via API

            onSave();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save drill');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!drill) return;
        
        if (!confirm('Are you sure you want to delete this drill? This action cannot be undone.')) {
            return;
        }

        setSaving(true);
        setError(null);

        try {
            await drillService.deleteDrill(drill.id);
            onSave();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete drill');
            setSaving(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-[#0e1428] border border-white/10 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-[#0e1428] z-10">
                    <h3 className="text-2xl font-bold text-white">
                        {isCreateMode ? 'Create New Drill' : 'Edit Drill'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-white/60" />
                    </button>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                        <AlertCircle size={18} className="text-red-400" />
                        <span className="text-red-400 text-sm">{error}</span>
                    </div>
                )}

                {/* Modal Content */}
                <div className="p-6 space-y-6">
                    {/* Basic Info Section */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
                            Basic Information
                        </h4>
                        
                        <div>
                            <label className="text-white/60 text-sm font-medium block mb-1">
                                Title <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter drill title..."
                                className="w-full px-4 py-2 bg-[#0b1020] border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="text-white/60 text-sm font-medium block mb-1">
                                Task <span className="text-red-400">*</span>
                            </label>
                            <textarea
                                value={task}
                                onChange={(e) => setTask(e.target.value)}
                                placeholder="Describe the drill task..."
                                rows={3}
                                className="w-full px-4 py-2 bg-[#0b1020] border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                            />
                        </div>
                    </div>

                    {/* Signals Section */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
                            Success & Fault Signals
                        </h4>
                        
                        <div>
                            <label className="text-white/60 text-sm font-medium block mb-1">
                                Success Signal
                            </label>
                            <div className="relative">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded-l-lg"></div>
                                <textarea
                                    value={successSignal}
                                    onChange={(e) => setSuccessSignal(e.target.value)}
                                    placeholder="What indicates successful execution..."
                                    rows={2}
                                    className="w-full pl-5 pr-4 py-2 bg-green-500/5 border border-green-500/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-green-500/40 transition-colors resize-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-white/60 text-sm font-medium block mb-1">
                                Fault Indicator
                            </label>
                            <div className="relative">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-lg"></div>
                                <textarea
                                    value={faultIndicator}
                                    onChange={(e) => setFaultIndicator(e.target.value)}
                                    placeholder="What indicates incorrect execution..."
                                    rows={2}
                                    className="w-full pl-5 pr-4 py-2 bg-red-500/5 border border-red-500/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-red-500/40 transition-colors resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Linked Issues Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Link2 size={20} className="text-blue-400" />
                                Linked Issues
                            </h4>
                            <button
                                onClick={() => setShowIssueSelector(!showIssueSelector)}
                                className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded text-white text-sm transition-colors"
                            >
                                <Plus size={14} />
                                Add Issue
                            </button>
                        </div>

                        {/* Issue Selector */}
                        {showIssueSelector && (
                            <div className="p-4 bg-[#0b1020] border border-white/10 rounded-lg">
                                <input
                                    type="text"
                                    value={issueSearchTerm}
                                    onChange={(e) => setIssueSearchTerm(e.target.value)}
                                    placeholder="Search issues..."
                                    className="w-full px-3 py-2 mb-3 bg-[#0e1428] border border-white/10 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:border-blue-500/50 transition-colors"
                                />
                                <div className="max-h-40 overflow-y-auto space-y-1">
                                    {availableIssues.length === 0 ? (
                                        <p className="text-white/40 text-sm text-center py-2">
                                            No available issues
                                        </p>
                                    ) : (
                                        availableIssues.slice(0, 10).map(issue => (
                                            <button
                                                key={issue.id}
                                                onClick={() => handleAddIssue(issue.id)}
                                                className="w-full text-left px-3 py-2 hover:bg-white/10 rounded text-white/80 text-sm transition-colors"
                                            >
                                                {issue.title}
                                                {issue.phase && (
                                                    <span className="ml-2 text-white/40 text-xs">
                                                        ({issue.phase})
                                                    </span>
                                                )}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Linked Issues List */}
                        {linkedIssues.length === 0 ? (
                            <p className="text-white/40 text-sm italic">
                                No issues linked to this drill yet.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {linkedIssues.map(issue => (
                                    <div
                                        key={issue.id}
                                        className="flex items-center justify-between p-3 bg-[#0b1020] border border-white/10 rounded-lg"
                                    >
                                        <div>
                                            <span className="text-white">{issue.title}</span>
                                            {issue.phase && (
                                                <span className="ml-2 text-white/40 text-xs">
                                                    ({issue.phase})
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleRemoveIssue(issue.id)}
                                            className="p-1 hover:bg-red-500/20 rounded transition-colors"
                                            title="Remove link"
                                        >
                                            <Trash2 size={16} className="text-red-400" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <p className="text-white/30 text-xs italic">
                            Note: Issue linking is not connected to the API yet.
                        </p>
                    </div>

                    {/* Meta Info (Edit mode only) */}
                    {!isCreateMode && (
                        <div className="pt-4 border-t border-white/10 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-white/60">Created</span>
                                <span className="text-white">
                                    {new Date(drill.created_at).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/60">ID</span>
                                <span className="text-white/40 font-mono text-xs">
                                    {drill.id}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-white/10 flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-[#0e1428]">
                    {!isCreateMode && (
                        <button
                            onClick={handleDelete}
                            disabled={saving}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Trash2 size={16} />
                            Delete
                        </button>
                    )}
                    <div className="flex-1"></div>
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <Save size={16} />
                        {saving ? 'Saving...' : (isCreateMode ? 'Create Drill' : 'Save Changes')}
                    </button>
                </div>
            </div>
        </div>
    );
}
