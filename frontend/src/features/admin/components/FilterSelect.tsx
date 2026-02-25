export interface FilterSelectOption {
    value: string;
    label: string;
}

export interface FilterSelectProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: FilterSelectOption[];
}

export default function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
    return (
        <div>
            <label className="text-white/60 text-sm block mb-1">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="px-3 py-2 bg-[#0e1428] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
            >
                {options.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>
        </div>
    );
}
