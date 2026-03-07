import {
    ChevronDown, ChevronUp, Star
} from 'lucide-react';
import { Feedback } from '../types';

interface FeedbackRowProps {
    feedback: Feedback;
    isExpanded: boolean;
    isSelected: boolean;
    onToggleExpand: () => void;
    onToggleSelect: () => void;
}

function RatingStars({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3].map((star) => (
                <Star
                    key={star}
                    size={16}
                    className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}
                />
            ))}
        </div>
    );
}

export default function FeedbackRow({ feedback, isExpanded, isSelected, onToggleExpand, onToggleSelect }: FeedbackRowProps) {
    return (
        <div className={`border border-white/5 rounded-lg overflow-hidden ${isSelected ? 'bg-blue-500/10 border-blue-500/20' : 'bg-[#0b1020]/50'}`}>
            {/* Main Row */}
            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_2fr_auto_auto] gap-2 sm:gap-4 p-3 sm:p-4 items-center">
                {/* Checkbox - Hidden on mobile */}
                <div className="hidden sm:flex items-center">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={onToggleSelect}
                        className="w-4 h-4 rounded bg-[#0b1020] border-white/20"
                    />
                </div>

                {/* Rating */}
                <div className="flex items-center justify-between sm:justify-start gap-2">
                    <RatingStars rating={feedback.rating} />
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

                {/* Comments preview */}
                <div className="text-white/70 text-sm line-clamp-2">
                    {feedback.comments || <span className="text-white/40 italic">No comments</span>}
                </div>

                {/* Created Date */}
                <div className="hidden sm:block text-white/60 text-sm whitespace-nowrap">
                    {new Date(feedback.createdAt).toLocaleDateString()}
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
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-4">
                    {/* Rating */}
                    <div>
                        <label className="text-white/50 text-xs font-medium uppercase tracking-wide mb-1 block">
                            Rating
                        </label>
                        <div className="flex items-center gap-2">
                            <RatingStars rating={feedback.rating} />
                            <span className="text-white/70 text-sm">({feedback.rating}/3)</span>
                        </div>
                    </div>

                    {/* Full Comments */}
                    <div>
                        <label className="text-white/50 text-xs font-medium uppercase tracking-wide mb-1 block">
                            Comments
                        </label>
                        <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                            <p className="text-white/80 text-sm whitespace-pre-wrap">
                                {feedback.comments || 'No comments provided'}
                            </p>
                        </div>
                    </div>

                    {/* Submitted At */}
                    <div>
                        <label className="text-white/50 text-xs font-medium uppercase tracking-wide mb-1 block">
                            Submitted At
                        </label>
                        <p className="text-white/70 text-sm">
                            {new Date(feedback.createdAt).toLocaleString()}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
