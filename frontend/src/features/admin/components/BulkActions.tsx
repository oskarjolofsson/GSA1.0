import { Trash2, X } from 'lucide-react';

export interface BulkActionsProps {
    selectedCount: number;
    entityName: string;
    entityNamePlural: string;
    onDelete: () => void;
    onClear: () => void;
}

export default function BulkActions({ 
    selectedCount, 
    entityName, 
    entityNamePlural, 
    onDelete, 
    onClear 
}: BulkActionsProps) {
    if (selectedCount === 0) {
        return null;
    }

    return (
        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-between">
            <span className="text-white/80">
                {selectedCount} {selectedCount === 1 ? entityName : entityNamePlural} selected
            </span>
            <div className="flex gap-2">
                <button
                    onClick={onDelete}
                    className="flex items-center gap-1 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded text-white text-sm transition-colors"
                >
                    <Trash2 size={14} />
                    Delete
                </button>
                <button
                    onClick={onClear}
                    className="flex items-center gap-1 px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded text-white text-sm transition-colors"
                >
                    <X size={14} />
                    Clear
                </button>
            </div>
        </div>
    );
}
