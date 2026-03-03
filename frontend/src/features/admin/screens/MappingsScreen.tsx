import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAdminData } from '../hooks/useAdminData';
import { 
    RefreshCw, 
    Search, 
    ChevronRight,
    Plus,
    Trash2,
    Link2,
    AlertTriangle,
    CheckCircle
} from 'lucide-react';
import type { Issue } from '@/features/issues/types';
import type { Drill } from '@/features/drills/types';
import mappingService from '@/features/mapping/services/mappingService';
import type { IssueDrill } from '@/features/mapping/types';
import { LoadingState, ErrorState } from '../components/error';

export default function MappingsScreen() {
    const { issues, drills, loading, error, refetch } = useAdminData();
    
    // Selected issue state
    const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
    
    // Search states
    const [issueSearchTerm, setIssueSearchTerm] = useState('');
    const [drillSearchTerm, setDrillSearchTerm] = useState('');
    
    // Linked drills state - maps issue_id to array of IssueDrill objects
    const [issueDrillMappings, setIssueDrillMappings] = useState<Map<string, IssueDrill[]>>(new Map());
    const [loadingMappings, setLoadingMappings] = useState(false);
    
    // Success/error feedback
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Clear feedback after 3 seconds
    useEffect(() => {
        if (feedback) {
            const timer = setTimeout(() => setFeedback(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [feedback]);

    // Fetch mappings for a specific issue
    const fetchMappingsForIssue = useCallback(async (issueId: string) => {
        try {
            const mappings = await mappingService.getIssueDrillsByIssueId(issueId);
            setIssueDrillMappings(prev => {
                const newMap = new Map(prev);
                newMap.set(issueId, mappings);
                return newMap;
            });
        } catch (err) {
            console.error('Failed to fetch mappings for issue:', err);
        }
    }, []);

    // Fetch mappings when issue is selected
    useEffect(() => {
        if (selectedIssueId && !issueDrillMappings.has(selectedIssueId)) {
            setLoadingMappings(true);
            fetchMappingsForIssue(selectedIssueId).finally(() => setLoadingMappings(false));
        }
    }, [selectedIssueId, issueDrillMappings, fetchMappingsForIssue]);

    // Filter issues based on search
    const filteredIssues = useMemo(() => {
        if (!issueSearchTerm) return issues;
        const lowerSearch = issueSearchTerm.toLowerCase();
        return issues.filter(issue =>
            issue.title.toLowerCase().includes(lowerSearch) ||
            (issue.phase && issue.phase.toLowerCase().includes(lowerSearch))
        );
    }, [issues, issueSearchTerm]);

    // Get selected issue
    const selectedIssue = useMemo(() => {
        return issues.find(i => i.id === selectedIssueId) || null;
    }, [issues, selectedIssueId]);

    // Get linked drill IDs for selected issue
    const linkedDrillIds = useMemo(() => {
        if (!selectedIssueId) return [];
        const mappings = issueDrillMappings.get(selectedIssueId) || [];
        return mappings.map(m => m.drill_id);
    }, [selectedIssueId, issueDrillMappings]);

    // Get linked drills for selected issue
    const linkedDrills = useMemo(() => {
        if (!selectedIssueId) return [];
        return drills.filter(d => linkedDrillIds.includes(d.id));
    }, [selectedIssueId, linkedDrillIds, drills]);

    // Get available (unlinked) drills
    const availableDrills = useMemo(() => {
        if (!selectedIssueId) return drills;
        let available = drills.filter(d => !linkedDrillIds.includes(d.id));
        
        if (drillSearchTerm) {
            const lowerSearch = drillSearchTerm.toLowerCase();
            available = available.filter(drill =>
                drill.title.toLowerCase().includes(lowerSearch) ||
                drill.task.toLowerCase().includes(lowerSearch)
            );
        }
        
        return available;
    }, [selectedIssueId, linkedDrillIds, drills, drillSearchTerm]);

    // Handle adding a drill to an issue
    const handleAddDrill = async (drillId: string) => {
        if (!selectedIssueId) return;
        
        const drill = drills.find(d => d.id === drillId);
        
        try {
            await mappingService.linkDrillToIssue(selectedIssueId, drillId);
            // Refresh mappings for this issue
            await fetchMappingsForIssue(selectedIssueId);
            setFeedback({ type: 'success', message: `Linked "${drill?.title}" to issue` });
        } catch (err) {
            console.error('Failed to link drill:', err);
            setFeedback({ type: 'error', message: `Failed to link "${drill?.title}"` });
        }
    };

    // Handle removing a drill from an issue
    const handleRemoveDrill = async (drillId: string) => {
        if (!selectedIssueId) return;
        
        const drill = drills.find(d => d.id === drillId);
        
        try {
            await mappingService.unlinkDrillFromIssue(selectedIssueId, drillId);
            // Refresh mappings for this issue
            await fetchMappingsForIssue(selectedIssueId);
            setFeedback({ type: 'success', message: `Removed "${drill?.title}" from issue` });
        } catch (err) {
            console.error('Failed to unlink drill:', err);
            setFeedback({ type: 'error', message: `Failed to remove "${drill?.title}"` });
        }
    };

    // Get linked drill count for an issue
    const getLinkedCount = (issueId: string) => {
        return issueDrillMappings.get(issueId)?.length || 0;
    };

    if (loading) {
        return <LoadingState title="Drill ↔ Issue Mappings" message="Loading data..." />;
    }

    if (error) {
        return (
            <ErrorState
                title="Drill ↔ Issue Mappings"
                error={error}
                onRetry={refetch}
            />
        );
    }

    return (
        <div className="h-full flex flex-col p-2 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 mx-2 sm:mx-0 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Link2 className="text-blue-400" size={32} />
                        Drill ↔ Issue Mappings
                    </h1>
                    <p className="text-white/60 mt-1">Link drills to issues for recommendations</p>
                </div>
                <button
                    onClick={refetch}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-white transition-colors"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {/* Feedback Toast */}
            {feedback && (
                <div className={`mx-2 sm:mx-0 mb-4 p-3 rounded-lg flex items-center gap-2 ${
                    feedback.type === 'success' 
                        ? 'bg-green-500/10 border border-green-500/20' 
                        : 'bg-red-500/10 border border-red-500/20'
                }`}>
                    {feedback.type === 'success' ? (
                        <CheckCircle size={18} className="text-green-400" />
                    ) : (
                        <AlertTriangle size={18} className="text-red-400" />
                    )}
                    <span className={feedback.type === 'success' ? 'text-green-400' : 'text-red-400'}>
                        {feedback.message}
                    </span>
                </div>
            )}

            {/* Loading indicator for mappings */}
            {loadingMappings && (
                <div className="mx-2 sm:mx-0 mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-2">
                    <RefreshCw size={18} className="text-blue-400 animate-spin" />
                    <span className="text-blue-400 text-sm">
                        Loading mappings...
                    </span>
                </div>
            )}

            {/* Three-Pane Layout */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
                {/* Left Pane: Issue List */}
                <div className="bg-[#0e1428]/80 backdrop-blur-md border border-white/10 rounded-lg flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-white/10">
                        <h2 className="text-lg font-semibold text-white mb-3">Issues</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" size={16} />
                            <input
                                type="text"
                                placeholder="Search issues..."
                                value={issueSearchTerm}
                                onChange={(e) => setIssueSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-[#0b1020] border border-white/10 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {filteredIssues.length === 0 ? (
                            <p className="text-white/40 text-sm text-center py-4">No issues found</p>
                        ) : (
                            <div className="space-y-1">
                                {filteredIssues.map(issue => (
                                    <IssueItem
                                        key={issue.id}
                                        issue={issue}
                                        isSelected={selectedIssueId === issue.id}
                                        linkedCount={getLinkedCount(issue.id)}
                                        onClick={() => setSelectedIssueId(issue.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="p-3 border-t border-white/10 text-white/40 text-xs">
                        {filteredIssues.length} issues
                    </div>
                </div>

                {/* Middle Pane: Linked Drills */}
                <div className="bg-[#0e1428]/80 backdrop-blur-md border border-white/10 rounded-lg flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-white/10">
                        <h2 className="text-lg font-semibold text-white mb-1">Linked Drills</h2>
                        {selectedIssue ? (
                            <p className="text-white/60 text-sm truncate">
                                For: <span className="text-blue-400">{selectedIssue.title}</span>
                            </p>
                        ) : (
                            <p className="text-white/40 text-sm">Select an issue</p>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {!selectedIssue ? (
                            <div className="flex flex-col items-center justify-center h-full text-white/40">
                                <ChevronRight size={32} className="mb-2 opacity-50" />
                                <p className="text-sm">Select an issue to view linked drills</p>
                            </div>
                        ) : linkedDrills.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-white/40">
                                <Link2 size={32} className="mb-2 opacity-50" />
                                <p className="text-sm text-center">No drills linked yet</p>
                                <p className="text-xs mt-1">Add drills from the right panel</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {linkedDrills.map(drill => (
                                    <LinkedDrillItem
                                        key={drill.id}
                                        drill={drill}
                                        onRemove={() => handleRemoveDrill(drill.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="p-3 border-t border-white/10 text-white/40 text-xs">
                        {linkedDrills.length} linked drills
                    </div>
                </div>

                {/* Right Pane: Available Drills */}
                <div className="bg-[#0e1428]/80 backdrop-blur-md border border-white/10 rounded-lg flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-white/10">
                        <h2 className="text-lg font-semibold text-white mb-3">Available Drills</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" size={16} />
                            <input
                                type="text"
                                placeholder="Search drills..."
                                value={drillSearchTerm}
                                onChange={(e) => setDrillSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-[#0b1020] border border-white/10 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:border-blue-500/50 transition-colors"
                                disabled={!selectedIssue}
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {!selectedIssue ? (
                            <div className="flex flex-col items-center justify-center h-full text-white/40">
                                <ChevronRight size={32} className="mb-2 opacity-50" />
                                <p className="text-sm">Select an issue first</p>
                            </div>
                        ) : availableDrills.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-white/40">
                                <CheckCircle size={32} className="mb-2 opacity-50" />
                                <p className="text-sm text-center">All drills are linked!</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {availableDrills.map(drill => (
                                    <AvailableDrillItem
                                        key={drill.id}
                                        drill={drill}
                                        onAdd={() => handleAddDrill(drill.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="p-3 border-t border-white/10 text-white/40 text-xs">
                        {availableDrills.length} available drills
                    </div>
                </div>
            </div>
        </div>
    );
}

// Issue Item Component
interface IssueItemProps {
    issue: Issue;
    isSelected: boolean;
    linkedCount: number;
    onClick: () => void;
}

function IssueItem({ issue, isSelected, linkedCount, onClick }: IssueItemProps) {
    return (
        <button
            onClick={onClick}
            className={`w-full text-left p-3 rounded-lg transition-colors ${
                isSelected 
                    ? 'bg-blue-500/20 border border-blue-500/30' 
                    : 'bg-[#0b1020]/50 border border-transparent hover:bg-white/5 hover:border-white/10'
            }`}
        >
            <div className="flex items-center justify-between gap-2">
                <span className={`font-medium truncate ${isSelected ? 'text-white' : 'text-white/80'}`}>
                    {issue.title}
                </span>
                {linkedCount > 0 && (
                    <span className="flex-shrink-0 px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded text-green-400 text-xs">
                        {linkedCount}
                    </span>
                )}
            </div>
            {issue.phase && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded text-purple-300 text-xs">
                    {issue.phase}
                </span>
            )}
        </button>
    );
}

// Linked Drill Item Component
interface LinkedDrillItemProps {
    drill: Drill;
    onRemove: () => void;
}

function LinkedDrillItem({ drill, onRemove }: LinkedDrillItemProps) {
    return (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <span className="text-white font-medium block truncate">{drill.title}</span>
                    <span className="text-white/50 text-xs line-clamp-2 mt-1">{drill.task}</span>
                </div>
                <button
                    onClick={onRemove}
                    className="flex-shrink-0 p-1.5 hover:bg-red-500/20 rounded transition-colors group"
                    title="Remove link"
                >
                    <Trash2 size={16} className="text-white/40 group-hover:text-red-400" />
                </button>
            </div>
        </div>
    );
}

// Available Drill Item Component
interface AvailableDrillItemProps {
    drill: Drill;
    onAdd: () => void;
}

function AvailableDrillItem({ drill, onAdd }: AvailableDrillItemProps) {
    return (
        <div className="p-3 bg-[#0b1020]/50 border border-white/5 rounded-lg hover:border-white/10 transition-colors">
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <span className="text-white/80 font-medium block truncate">{drill.title}</span>
                    <span className="text-white/40 text-xs line-clamp-2 mt-1">{drill.task}</span>
                </div>
                <button
                    onClick={onAdd}
                    className="flex-shrink-0 p-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded transition-colors"
                    title="Add link"
                >
                    <Plus size={16} className="text-blue-400" />
                </button>
            </div>
        </div>
    );
}
