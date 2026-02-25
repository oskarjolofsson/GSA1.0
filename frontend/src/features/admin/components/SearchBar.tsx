import { Search, Filter } from 'lucide-react';

export interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    filterToggle?: {
        showFilters: boolean;
        onToggle: () => void;
    };
}

export default function SearchBar({ 
    value, 
    onChange, 
    placeholder, 
    filterToggle 
}: SearchBarProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
            {/* Search */}
            <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" size={20} />
                <input
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#0b1020] border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
            </div>
            
            {/* Filter Toggle - only shown if filterToggle is provided */}
            {filterToggle && (
                <button
                    onClick={filterToggle.onToggle}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-white transition-colors ${
                        filterToggle.showFilters ? 'bg-blue-500/20 border-blue-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                >
                    <Filter size={16} />
                    Filters
                </button>
            )}
        </div>
    );
}
