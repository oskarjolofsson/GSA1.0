import type { Drill } from '@/features/drills/types';
import { X } from 'lucide-react';

interface DrillDetailModalProps {
    drill: Drill;
    onClose: () => void;
}

export default function DrillDetailModal({ drill, onClose }: DrillDetailModalProps) {
    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-[#0e1428] border border-white/10 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h3 className="text-2xl font-bold text-white">Drill Details</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-white/60" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-white/60 text-sm font-medium">Title</label>
                        <p className="text-white text-lg mt-1">{drill.title}</p>
                    </div>

                    <div>
                        <label className="text-white/60 text-sm font-medium">Task</label>
                        <p className="text-white mt-1">{drill.task}</p>
                    </div>

                    <div>
                        <label className="text-white/60 text-sm font-medium">Success Signal</label>
                        <p className="text-white mt-1">{drill.success_signal}</p>
                    </div>

                    <div>
                        <label className="text-white/60 text-sm font-medium">Fault Indicator</label>
                        <p className="text-white mt-1">{drill.fault_indicator}</p>
                    </div>

                    <div className="pt-4 border-t border-white/10 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-white/60">Created</span>
                            <span className="text-white">
                                {new Date(drill.created_at).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-white/60">ID</span>
                            <span className="text-white/40 font-mono text-xs break-all">
                                {drill.id}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-white transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
