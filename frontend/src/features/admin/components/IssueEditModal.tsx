import { useState, useEffect, useRef } from 'react';
import type { Issue, CreateIssueRequest, UpdateIssueRequest } from '@/features/issues/types';
import type { Drill } from '@/features/drills/types';
import { X, Plus, Trash2, Link2, Save, AlertCircle } from 'lucide-react';
import issueService from '@/features/issues/services/issueService';
import mappingService from '@/features/mapping/services/mappingService';

interface IssueEditModalProps {
    issue: Issue | null; // null for create mode
    drills: Drill[];
    onClose: () => void;
    onSave: () => void;
}

export default function IssueEditModal({ issue, drills, onClose, onSave }: IssueEditModalProps) {
    const isCreateMode = !issue;
    
    // Form state
    const [title, setTitle] = useState(issue?.title || '');
    const [phase, setPhase] = useState(issue?.phase || '');
    const [currentMotion, setCurrentMotion] = useState(issue?.current_motion || '');
    const [expectedMotion, setExpectedMotion] = useState(issue?.expected_motion || '');
    const [swingEffect, setSwingEffect] = useState(issue?.swing_effect || '');
    const [shotOutcome, setShotOutcome] = useState(issue?.shot_outcome || '');
    
    // Linked drills state
    const [linkedDrillIds, setLinkedDrillIds] = useState<string[]>([]);
    const [initialLinkedDrillIds, setInitialLinkedDrillIds] = useState<string[]>([]);
    const [showDrillSelector, setShowDrillSelector] = useState(false);
    const [drillSearchTerm, setDrillSearchTerm] = useState('');
    const [loadingLinks, setLoadingLinks] = useState(false);
    
    // UI state
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Common phase options for golf swing
    const phaseOptions = [
        'SETUP','BACKSWING','TRANSITION','DOWNSWING','IMPACT','FOLLOW_THROUGH'
    ];

    // Filter drills for selector
    const availableDrills = drills.filter(drill => 
        !linkedDrillIds.includes(drill.id) &&
        (drillSearchTerm === '' || 
         drill.title.toLowerCase().includes(drillSearchTerm.toLowerCase()))
    );

    const linkedDrills = drills.filter(drill => linkedDrillIds.includes(drill.id));

    // Load linked drills when editing
    useEffect(() => {
        if (issue) {
            setLoadingLinks(true);
            mappingService.getLinkedDrillIds(issue.id)
                .then(ids => {
                    setLinkedDrillIds(ids);
                    setInitialLinkedDrillIds(ids);
                })
                .catch(err => {
                    console.error('Failed to load linked drills:', err);
                })
                .finally(() => setLoadingLinks(false));
        }
    }, [issue]);

    const handleAddDrill = (drillId: string) => {
        setLinkedDrillIds(prev => [...prev, drillId]);
        setShowDrillSelector(false);
        setDrillSearchTerm('');
    };

    const handleRemoveDrill = (drillId: string) => {
        setLinkedDrillIds(prev => prev.filter(id => id !== drillId));
    };

    const handleSave = async () => {
        if (!title.trim()) {
            setError('Title is required');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            let issueId: string;
            
            if (isCreateMode) {
                const request: CreateIssueRequest = {
                    title: title.trim(),
                    phase: phase.trim() || undefined,
                    current_motion: currentMotion.trim() || undefined,
                    expected_motion: expectedMotion.trim() || undefined,
                    swing_effect: swingEffect.trim() || undefined,
                    shot_outcome: shotOutcome.trim() || undefined,
                };
                const response = await issueService.createIssue(request);
                issueId = response.issue_id;
            } else {
                const request: UpdateIssueRequest = {
                    title: title.trim(),
                    phase: phase.trim() || undefined,
                    current_motion: currentMotion.trim() || undefined,
                    expected_motion: expectedMotion.trim() || undefined,
                    swing_effect: swingEffect.trim() || undefined,
                    shot_outcome: shotOutcome.trim() || undefined,
                };
                await issueService.updateIssue(issue.id, request);
                issueId = issue.id;
            }

            // Update linked drills via API
            const toAdd = linkedDrillIds.filter(id => !initialLinkedDrillIds.includes(id));
            const toRemove = initialLinkedDrillIds.filter(id => !linkedDrillIds.includes(id));
            
            await Promise.all([
                ...toAdd.map(drillId => mappingService.linkDrillToIssue(issueId, drillId)),
                ...toRemove.map(drillId => mappingService.unlinkDrillFromIssue(issueId, drillId)),
            ]);

            onSave();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save issue');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!issue) return;
        
        if (!confirm('Are you sure you want to delete this issue? This action cannot be undone.')) {
            return;
        }

        setSaving(true);
        setError(null);

        try {
            await issueService.deleteIssue(issue.id);
            onSave();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete issue');
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
                        {isCreateMode ? 'Create New Issue' : 'Edit Issue'}
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
                                placeholder="Enter issue title..."
                                className="w-full px-4 py-2 bg-[#0b1020] border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="text-white/60 text-sm font-medium block mb-1">
                                Phase
                            </label>
                            <select
                                value={phase}
                                onChange={(e) => setPhase(e.target.value)}
                                className="w-full px-4 py-2 bg-[#0b1020] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                            >
                                <option value="">Select phase...</option>
                                {phaseOptions.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Motion Section */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
                            Motion Details
                        </h4>
                        
                        <div>
                            <label className="text-white/60 text-sm font-medium block mb-1">
                                Current Motion (What's happening)
                            </label>
                            <div className="relative">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 rounded-l-lg"></div>
                                <textarea
                                    value={currentMotion}
                                    onChange={(e) => setCurrentMotion(e.target.value)}
                                    placeholder="Describe the current incorrect motion..."
                                    rows={2}
                                    className="w-full pl-5 pr-4 py-2 bg-amber-500/5 border border-amber-500/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-amber-500/40 transition-colors resize-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-white/60 text-sm font-medium block mb-1">
                                Expected Motion (What should happen)
                            </label>
                            <div className="relative">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded-l-lg"></div>
                                <textarea
                                    value={expectedMotion}
                                    onChange={(e) => setExpectedMotion(e.target.value)}
                                    placeholder="Describe the correct motion that should occur..."
                                    rows={2}
                                    className="w-full pl-5 pr-4 py-2 bg-green-500/5 border border-green-500/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-green-500/40 transition-colors resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Effects Section */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
                            Effects & Outcomes
                        </h4>
                        
                        <div>
                            <label className="text-white/60 text-sm font-medium block mb-1">
                                Swing Effect
                            </label>
                            <div className="relative">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-lg"></div>
                                <textarea
                                    value={swingEffect}
                                    onChange={(e) => setSwingEffect(e.target.value)}
                                    placeholder="How does this affect the overall swing..."
                                    rows={2}
                                    className="w-full pl-5 pr-4 py-2 bg-blue-500/5 border border-blue-500/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500/40 transition-colors resize-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-white/60 text-sm font-medium block mb-1">
                                Shot Outcome
                            </label>
                            <div className="relative">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-lg"></div>
                                <textarea
                                    value={shotOutcome}
                                    onChange={(e) => setShotOutcome(e.target.value)}
                                    placeholder="Typical ball flight or shot result..."
                                    rows={2}
                                    className="w-full pl-5 pr-4 py-2 bg-red-500/5 border border-red-500/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-red-500/40 transition-colors resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Linked Drills Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Link2 size={20} className="text-blue-400" />
                                Linked Drills
                            </h4>
                            <button
                                onClick={() => setShowDrillSelector(!showDrillSelector)}
                                className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded text-white text-sm transition-colors"
                            >
                                <Plus size={14} />
                                Add Drill
                            </button>
                        </div>

                        {/* Drill Selector */}
                        {showDrillSelector && (
                            <div className="p-4 bg-[#0b1020] border border-white/10 rounded-lg">
                                <input
                                    type="text"
                                    value={drillSearchTerm}
                                    onChange={(e) => setDrillSearchTerm(e.target.value)}
                                    placeholder="Search drills..."
                                    className="w-full px-3 py-2 mb-3 bg-[#0e1428] border border-white/10 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:border-blue-500/50 transition-colors"
                                />
                                <div className="max-h-40 overflow-y-auto space-y-1">
                                    {availableDrills.length === 0 ? (
                                        <p className="text-white/40 text-sm text-center py-2">
                                            No available drills
                                        </p>
                                    ) : (
                                        availableDrills.slice(0, 10).map(drill => (
                                            <button
                                                key={drill.id}
                                                onClick={() => handleAddDrill(drill.id)}
                                                className="w-full text-left px-3 py-2 hover:bg-white/10 rounded text-white/80 text-sm transition-colors"
                                            >
                                                {drill.title}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Linked Drills List */}
                        {loadingLinks ? (
                            <p className="text-white/40 text-sm italic">
                                Loading linked drills...
                            </p>
                        ) : linkedDrills.length === 0 ? (
                            <p className="text-white/40 text-sm italic">
                                No drills linked to this issue yet.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {linkedDrills.map(drill => (
                                    <div
                                        key={drill.id}
                                        className="flex items-center justify-between p-3 bg-[#0b1020] border border-white/10 rounded-lg"
                                    >
                                        <span className="text-white">{drill.title}</span>
                                        <button
                                            onClick={() => handleRemoveDrill(drill.id)}
                                            className="p-1 hover:bg-red-500/20 rounded transition-colors"
                                            title="Remove link"
                                        >
                                            <Trash2 size={16} className="text-red-400" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Meta Info (Edit mode only) */}
                    {!isCreateMode && (
                        <div className="pt-4 border-t border-white/10 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-white/60">Created</span>
                                <span className="text-white">
                                    {new Date(issue.created_at).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/60">ID</span>
                                <span className="text-white/40 font-mono text-xs">
                                    {issue.id}
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
                        {saving ? 'Saving...' : (isCreateMode ? 'Create Issue' : 'Save Changes')}
                    </button>
                </div>
            </div>
        </div>
    );
}
